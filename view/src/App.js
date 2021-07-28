import { Component } from 'react';
import AuthPage from './AuthPage'
import HomePage from './HomePage';
import AlbumsPage from './AlbumsPage';
import PhotosPage from './PhotosPage';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {
  constructor() {
    super()
    this.state = {
      isLoggedIn: false,
      showAlbumsPage: false,
      showPhotosPage: false,
      appUserID: 0,
      albums: [],
    }
  }

  setLoggedIn = async (userID) => {
    this.setState({ appUserID: userID, isLoggedIn: true })
  }

  showAlbumsPage = async () => {
    this.setState({ showAlbumsPage: true })
  }

  showPhotosPage = async () => {
    this.setState({ showPhotosPage: true })
  }

  goBackToHomePage = async () => {
    this.setState({ showAlbumsPage: false, showPhotosPage: false })
  }

  getAlbums = async () => {
    await fetch("/api/album/user/" + encodeURIComponent(this.state.appUserID), {
        method: "GET",
        headers: {
            "content-type": "application/json",
        }
    }).then(async (resp) => {
        if (resp.status !== 200) {
            console.error("bad response code: ", resp.status)
        } else {
            let respJSON = await resp.json();
            this.setState({ albums: respJSON })
        }
    })
}

  render() {
    return (
      <div className="App">
        {this.state.isLoggedIn && !this.state.showAlbumsPage && !this.state.showPhotosPage ?
          <HomePage
            appUserID={this.state.appUserID}
            showAlbumsPage={this.showAlbumsPage}
            showPhotosPage={this.showPhotosPage}
          />
          :
          null
        }
        {!this.state.isLoggedIn ?
          <AuthPage
            isLoggedIn={this.state.isLoggedIn}
            setLoggedIn={this.setLoggedIn}
          />
          :
          null
        }
        {this.state.showAlbumsPage ?
          <AlbumsPage
            appUserID={this.state.appUserID}
            goBackToHomePage={this.goBackToHomePage}
            albums={this.state.albums}
            getAlbums={this.getAlbums}
          />
          :
          null
        }
        {this.state.showPhotosPage ?
          <PhotosPage
            appUserID={this.state.appUserID}
            goBackToHomePage={this.goBackToHomePage}
            albums={this.state.albums}
          />
          :
          null
        }
      </div>
    );
  }
}

export default App;
