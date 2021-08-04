import { Component } from 'react';
import AuthPage from './AuthPage'
import HomePage from './HomePage';
import AlbumsPage from './AlbumsPage';
import PhotosPage from './PhotosPage';
import AccountPage from './AccountPage';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {
  constructor() {
    super()
    this.state = {
      isLoggedIn: false,
      appUserID: 0,
      albums: [],
      showError: false,
      errorMsg: "",
      isUnknownError: true,
      userErrorDescription: "",
      showAuthModal: false,
      showAccountModal: false,
      pageToShow: "home",
    }
  }

  setLoggedIn = async (userID, token) => {
    localStorage.setItem('token', token);
    this.setState({
      appUserID: userID,
      isLoggedIn: true,
      showAuthModal: false,
    })
  }

  setLoggedOut = async () => {
    localStorage.removeItem('token');
    this.setState({
      appUserID: 0,
      isLoggedIn: false,
      albums: [],
      pageToShow: "home",
      showAuthModal: false,
    })
  }

  closeAccountModal = async () => {
    this.setState({
      showAccountModal: false,
    })
  }

  showPage = async (page) => {
    this.setState({ pageToShow: page })
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
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Container>
            <Navbar.Brand
              onClick={() => this.showPage("home")}
            >Def Not PB</Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="me-auto">
                {this.state.isLoggedIn ?
                  <Container>
                    <Nav.Link
                      onClick={() => this.showPage("albums")}
                    >Albums</Nav.Link>
                    <Nav.Link
                      onClick={() => this.showPage("photos")}
                    >Photos</Nav.Link>
                  </Container>
                  :
                  null
                }
              </Nav>
              <Nav>
                {this.state.isLoggedIn ?
                  <Container>
                    <Nav.Link
                      onClick={() => this.setState({ showAccountModal: true })}
                    >Account</Nav.Link>
                    <Nav.Link
                      onClick={this.setLoggedOut}
                    >Logout</Nav.Link>
                  </Container>
                  :
                  <Nav.Link
                    onClick={() => this.setState({ showAuthModal: true })}
                  >Sign In/Register</Nav.Link>
                }
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        {this.state.pageToShow === "home" ?
          this.state.isLoggedIn ?
            <HomePage
              appUserID={this.state.appUserID}
              displayError={this.displayError}
            />
            :
            <p>Not logged in content page</p>
          :
          null
        }
        {this.state.pageToShow === "albums" ?
          <AlbumsPage
            appUserID={this.state.appUserID}
            albums={this.state.albums}
            getAlbums={this.getAlbums}
            displayError={this.displayError}
          />
          :
          null
        }
        {this.state.pageToShow === "photos" ?
          <PhotosPage
            appUserID={this.state.appUserID}
            albums={this.state.albums}
            getAlbums={this.getAlbums}
            displayError={this.displayError}
          />
          :
          null
        }
        {this.state.showAuthModal ?
          <Modal
            show={true}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            backdrop="static"
          >
            <Modal.Body>
              <AuthPage
                isLoggedIn={this.state.isLoggedIn}
                setLoggedIn={this.setLoggedIn}
                setLoggedOut={this.setLoggedOut}
                displayError={this.displayError}
              />
            </Modal.Body>
          </Modal>
          :
          null
        }
        {this.state.showAccountModal ?
          <Modal
            show={true}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            backdrop="static"
          >
            <Modal.Body>
              <AccountPage
                appUserID={this.state.appUserID}
                closeAccountModal={this.closeAccountModal}
                displayError={this.displayError}
              />
            </Modal.Body>
          </Modal>
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
