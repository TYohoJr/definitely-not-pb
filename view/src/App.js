import { Component } from 'react';
import AuthPage from './AuthPage'
import HomePage from './HomePage';
import AlbumsPage from './AlbumsPage';
import PhotosPage from './PhotosPage';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
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
      showError: false,
      errorMsg: "",
      isUnknownError: true,
      userErrorDescription: "",
    }
  }

  setLoggedIn = async (userID, token) => {
    localStorage.setItem('token', token);
    this.setState({ appUserID: userID, isLoggedIn: true })
  }

  setLoggedOut = async () => {
    localStorage.removeItem('token');
    this.setState({
      appUserID: 0,
      isLoggedIn: false,
      albums: [],
      showAlbumsPage: false,
      showPhotosPage: false,
    })
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
    const token = localStorage.getItem('token');
    await fetch("/api/album/user/" + encodeURIComponent(this.state.appUserID), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    }).then(async (resp) => {
      if (resp.status !== 200) {
        let errorMsg = await resp.text();
        this.displayError(errorMsg, true);
      } else {
        let respJSON = await resp.json();
        this.setState({ albums: respJSON })
      }
    })
  }

  displayError = (msg, isUnknown) => {
    this.setState({ errorMsg: msg, showError: true, isUnknownError: isUnknown })
  }

  closeError = () => {
    this.setState({
      showError: false,
      errorMsg: "",
      isUnknownError: true,
      userErrorDescription: ""
    })
  }

  handleUserErrorDescriptionChange = (e) => {
    this.setState({ userErrorDescription: e.target.value })
  }

  reportError = async () => {
    const token = localStorage.getItem('token');
    let errorData = {
      error_message: this.state.errorMsg,
      user_description: this.state.userErrorDescription,
      app_user_id: this.state.appUserID,
    }
    await fetch("/api/error_event/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(errorData)
    }).finally(() => {
      this.closeError()
    });
  }

  render() {
    let vw = window.innerWidth * 0.01;
    document.documentElement.style.setProperty('--vw', `${vw}px`);
    window.addEventListener('resize', () => {
      let vw = window.innerWidth * 0.01;
      document.documentElement.style.setProperty('--vw', `${vw}px`);
    });
    return (
      <div className="App">
        {this.state.isLoggedIn && !this.state.showAlbumsPage && !this.state.showPhotosPage ?
          <HomePage
            appUserID={this.state.appUserID}
            showAlbumsPage={this.showAlbumsPage}
            showPhotosPage={this.showPhotosPage}
            displayError={this.displayError}
          />
          :
          null
        }
        {!this.state.isLoggedIn ?
          <AuthPage
            isLoggedIn={this.state.isLoggedIn}
            setLoggedIn={this.setLoggedIn}
            displayError={this.displayError}
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
            logOut={this.setLoggedOut}
            displayError={this.displayError}
          />
          :
          null
        }
        {this.state.showPhotosPage ?
          <PhotosPage
            appUserID={this.state.appUserID}
            goBackToHomePage={this.goBackToHomePage}
            albums={this.state.albums}
            logOut={this.setLoggedOut}
            getAlbums={this.getAlbums}
            displayError={this.displayError}
          />
          :
          null
        }
        {this.state.showError ?
          <Modal
            show={true}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            backdrop="static"
          >
            <Modal.Header>
              <Modal.Title>An error has occured</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {this.state.errorMsg}
              <br />
              <br />
              {this.state.isUnknownError ?
                <span>
                  <Form.Label
                    className="upload-form-label upload-form-description-label"
                  >Description of what you were doing when the error occured:</Form.Label>
                  <Form.Control
                    as="textarea"
                    onChange={(e) => this.handleUserErrorDescriptionChange(e)}
                    value={this.state.userErrorDescription}
                  />
                </span>
                :
                null
              }
            </Modal.Body>
            <Modal.Footer>
              {this.state.isUnknownError ?
                <span>
                  <Button variant="success" onClick={this.reportError}>Report Error</Button>
                  <Button variant="primary" onClick={this.closeError}>Continue Without Reporting</Button>
                </span>
                :
                <Button variant="primary" onClick={this.closeError}>Ok</Button>
              }
            </Modal.Footer>
          </Modal>
          :
          null
        }
      </div>
    );
  }
}

export default App;
