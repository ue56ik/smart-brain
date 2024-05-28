import './App.css';
import React, { Component } from 'react';
import Navigation from "./Components/Navigation/Navigation";
import Logo from "./Components/Logo/Logo";
import Rank from "./Components/Rank/Rank";
import SignIn from "./Components/SignIn/SignIn";
import Register from "./Components/Register/Register";
import FaceRecognition from "./Components/FaceRecognition/FaceRecognition";
import ParticlesBg from 'particles-bg';
import ImageLinkForm from "./Components/ImageLinkForm/ImageLinkForm";

// Define API request function
const ReturnClarifyRequest = (imageUrl) => {
  // Move sensitive information to environment variables or config file
  const PAT = 'ffeafce752b544f5b28887ed7b854aec';
  const USER_ID = 'gs2vi2ljgk';
  const APP_ID = '12';
  const IMAGE_URL = imageUrl;

  // Construct request options
  const requestOptions = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT
    },
    body: JSON.stringify({
      "user_app_id": {
          "user_id": USER_ID,
          "app_id": APP_ID
      },
      "inputs": [
          {
              "data": {
                  "image": {
                      "url": IMAGE_URL
                  }
              }
          }
      ]
    })
  };

  return requestOptions;
}

const initialState = {
  input: '',
  imageUrl: '',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
};

// Define the App component
class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  // Load user data into state
  loadUser = (data) => {
  this.setState({
    user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: parseInt(data.entries), // Convert entries to a number
      joined: data.joined
    }
  });
}


  // Calculate face location for displaying bounding box
  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputImage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  // Display bounding box around detected face
  displayFaceBox = (box) => {
    this.setState({ box: box });
  }

  // Handle input change in ImageLinkForm component
  onChangeInput = (event) => {
    this.setState({ input: event.target.value });
  }

  // Handle button submit in ImageLinkForm component
  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input }, () => {
      // Make API call to Clarifai for face detection
      fetch("https://api.clarifai.com/v2/models/face-detection/outputs", ReturnClarifyRequest(this.state.input))
        .then(response => response.json())
        .then(response => {
          if (response) {
            // If response is successful, update user entries count
            fetch('https://boiling-reef-59735-a1ec3bc7fd5a.herokuapp.com/image', {
              method: 'put',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: this.state.user.id })
            })
              .then(response => response.json())
              .then(count => {
                this.setState(prevState => ({
                  user: {
                    ...prevState.user,
                    entries: count
                  }
                }));
              })
              .catch(error => console.log('Error updating entries:', error));
          }
          // Calculate and display face box
          this.displayFaceBox(this.calculateFaceLocation(response))
        })
        .catch(error => console.log('Error detecting face:', error));
    });
  }

  // Handle route change
  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState);
    } else if (route === 'home') {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route: route });
  }

  render() {
    const { isSignedIn, route, user, box, imageUrl } = this.state;

    return (
      <div className="App">
        <ParticlesBg type="cobweb" bg={true} color='#E6E6FA' num={100} />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        { route === 'home' ?
          <div>
            <Logo />
            <Rank name={user.name} entries={user.entries} />
            <ImageLinkForm onChangeInput={this.onChangeInput} onButtonSubmit={this.onButtonSubmit} />
            <FaceRecognition box={box} imageUrl={imageUrl} />
          </div>
          : (route === 'signin' ?
            <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} /> :
            <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
          )
        }
      </div>
    );
  }
}

export default App;
