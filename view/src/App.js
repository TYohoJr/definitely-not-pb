import { Component, Fragment } from 'react';
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
import jwt_decode from "jwt-decode";
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
      errorHeader: "An error has occured",
      isUnknownError: true,
      userErrorDescription: "",
      showAuthModal: false,
      showAccountModal: false,
      pageToShow: "home",
      logOutRequired: false,
      isRegistering: false,
      navExpanded: false,
      acctType: "",
      use_dark_mode: false,
      commit_hash: "local",
      copy_year: "2021",
    }
  }

  componentDidMount() {
    if (process.env) {
      if (process.env.REACT_APP_COMMIT_HASH && process.env.REACT_APP_COMMIT_HASH.length > 7) {
        let commit_hash = process.env.REACT_APP_COMMIT_HASH
        commit_hash = commit_hash.substring(0, 7)
        this.setState({
          commit_hash: commit_hash
        })
      }
      if (process.env.REACT_APP_COPY_YEAR) {
        let copy_year = process.env.REACT_APP_COPY_YEAR
        this.setState({
          copy_year: copy_year
        })
      } else {
        let copy_year = new Date().getFullYear().toString()
        this.setState({
          copy_year: copy_year
        })
      }
    }
    this.setState({
      showAuthModal: false,
      showAccountModal: false,
    })
    const token = localStorage.getItem('token');
    if (token) {
      this.setLoggedIn(token)
    }
  }

  verifyToken = (tkn) => {
    if (!tkn.iss || tkn.iss !== "DNP") { // wrong issuer
      this.displayError("invalid token", false)
      return false
    }
    var now = Math.floor(new Date().getTime() / 1000);
    if (!tkn.exp || now > tkn.exp) { // expired token
      this.displayError("invalid token", false)
      return false
    }
    if (!tkn.user_id || tkn.user_id < 1) { // missing or invalid user_id
      this.displayError("invalid token", false)
      return false
    }
    return true
  }

  setLoggedIn = async (token) => {
    var decoded = jwt_decode(token);
    let isValid = this.verifyToken(decoded)
    if (isValid) {
      localStorage.setItem('token', token);
      this.getAcctType()
      this.setState({
        appUserID: decoded.user_id,
        use_dark_mode: decoded.use_dark_mode,
        isLoggedIn: true,
        showAuthModal: false,
      }, () => {
        this.getAcctType()
        this.showPage("photos")
      })
    }
  }

  getAcctType = async () => {
    const token = localStorage.getItem('token');
    await fetch("/api/account_type", {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    }).then(async (resp) => {
      let acctType = ""
      if (resp.status === 200) {
        let acctTypeInfo = await resp.json();
        acctType = acctTypeInfo.type
      }
      this.setState({
        acctType: acctType,
      })
    });
  }

  setLoggedOut = async () => {
    localStorage.removeItem('token');
    this.setState({
      appUserID: 0,
      isLoggedIn: false,
      albums: [],
      pageToShow: "home",
      showAuthModal: false,
      showError: false,
      errorMsg: "",
      isUnknownError: true,
      userErrorDescription: "",
      logOutRequired: false,
      isRegistering: false,
      showAccountModal: false,
      use_dark_mode: false,
    })
  }

  showLoginPage = async () => {
    this.setState({ isRegistering: false }, () => {
      this.setState({
        showAuthModal: true
      })
    })
  }

  showRegisterPage = async () => {
    this.setState({ isRegistering: true }, () => {
      this.setState({
        showAuthModal: true
      })
    })
  }

  closeAuthPage = async () => {
    this.setState({ isRegistering: false }, () => {
      this.setState({
        showAuthModal: false
      })
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
        this.setState({ albums: [] }, async () => {
          for (let i = 0; i < respJSON.length; i++) {
            let albums = this.state.albums
            let albumPhotos = await this.getAlbumPhotos(respJSON[i].id);
            let url = "https://www.generationsforpeace.org/wp-content/uploads/2018/03/empty.jpg"
            if (albumPhotos.length > 0) {
              url = await this.getPhotoURL(albumPhotos[0].photo_id)
            }
            var obj = respJSON[i];
            obj.photo_url = url
            albums.push(obj)
            this.setState({ albums: albums })
          }
        })
      }
    })
  }

  getAlbumPhotos = async (albumID) => {
    const token = localStorage.getItem('token');
    return await fetch("/api/album_photo/album/" + encodeURIComponent(albumID), {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    }).then(async (resp) => {
      let albumPhotos = []
      if (resp.status === 200) {
        albumPhotos = await resp.json();
      }
      return albumPhotos
    });
  }

  getPhotoURL = async (photoID) => {
    const token = localStorage.getItem('token');
    return await fetch("/api/photo/id/" + encodeURIComponent(photoID), {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    }).then(async (resp) => {
      let url = "https://www.generationsforpeace.org/wp-content/uploads/2018/03/empty.jpg"
      if (resp.status === 200) {
        url = await resp.json();
      }
      return url
    });
  }

  displayError = (msg, isUnknown, errorHeader) => {
    if (!errorHeader) {
      errorHeader = "An error has occured"
    }
    let msgStr = String(msg).trim()
    if (msgStr === "signature is invalid" || msgStr === "invalid token") { // token is no longer valid, force logout
      this.setState({ logOutRequired: true })
      msgStr = "Session expired, please sign in"
      isUnknown = false
    }
    if (msgStr.includes("<html>") || !msgStr) { // error response from backend contains html and shouldn't be displayed, likely a server timeout or no msg occured
      msgStr = "Uknown error occured"
      isUnknown = false
    }
    if (msgStr.includes("reached monthly")) { // error is about reaching a monthly limit, dont need to allow error submit, just display
      isUnknown = false
    }
    if (msgStr.includes("email already")) { // error is about an email already being in use, just display
      isUnknown = false
    }
    if (msgStr.includes("email not found") || msgStr.includes("incorrect code") || msgStr.includes("code is expired")) { // error is about an issue when trying to reset a password, just display
      isUnknown = false
    }
    this.setState({ errorMsg: msgStr, errorHeader: errorHeader, showError: true, isUnknownError: isUnknown })
  }

  closeError = () => {
    if (this.state.logOutRequired) {
      this.setLoggedOut()
      return
    }
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

  updateDarkMode = (use_dark_mode) => {
    this.setState({ use_dark_mode: use_dark_mode })
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
    let bodyBC = ""
    let modalBC = ""
    let bodyTC = ""
    if (this.state.use_dark_mode) { // use dark mode
      bodyBC = "4c4c4c"
      bodyTC = "f7f7f7"
      modalBC = "4c4c4c"
    } else { // use light mode
      bodyBC = "f7f7f7"
      bodyTC = "212529"
      modalBC = "f7f7f7"
    }
    document.documentElement.style.setProperty('--body-background-color', `#${bodyBC}`);
    document.documentElement.style.setProperty('--body-color', `#${bodyTC}`);
    document.documentElement.style.setProperty('--modal-background-color', `#${modalBC}`);
    return (
      <div className="App">
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Container>
            <Navbar.Brand
              onClick={() => this.showPage("home")}
            >Definitely Not PB</Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="me-auto">
                {this.state.isLoggedIn ?
                  <Fragment>
                    <Nav.Link
                      onClick={(e) => this.showPage("albums")}
                    >View Albums</Nav.Link>
                    <Nav.Link
                      onClick={() => this.showPage("photos")}
                    >Manage Photos</Nav.Link>
                  </Fragment>
                  :
                  null
                }
              </Nav>
              <Nav>
                {this.state.isLoggedIn ?
                  <Fragment>
                    <Nav.Link
                      onClick={() => this.setState({ showAccountModal: true })}
                    >Account</Nav.Link>
                    <Nav.Link
                      onClick={this.setLoggedOut}
                    >Logout</Nav.Link>
                  </Fragment>
                  :
                  <Fragment>
                    <Nav.Link
                      onClick={this.showLoginPage}
                    >Login</Nav.Link>
                    <Nav.Link
                      onClick={this.showRegisterPage}
                    >Register</Nav.Link>
                  </Fragment>
                }
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        {this.state.pageToShow === "home" ?
          <HomePage
            appUserID={this.state.appUserID}
            displayError={this.displayError}
          />
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
                isRegistering={this.state.isRegistering}
                closeAuthPage={this.closeAuthPage}
                showLoginPage={this.showLoginPage}
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
                getAcctType={this.getAcctType}
                acctType={this.state.acctType}
                setLoggedOut={this.setLoggedOut}
                updateDarkMode={this.updateDarkMode}
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
            className="error-modal"
          >
            <Modal.Header>
              <Modal.Title>{this.state.errorHeader}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {this.state.errorMsg}
              <br />
              <br />
              {this.state.isUnknownError ?
                <Fragment>
                  <Form.Label
                    className="upload-form-label upload-form-description-label"
                  >Description of what you were doing when the error occured:</Form.Label>
                  <Form.Control
                    as="textarea"
                    required={true}
                    maxLength={500}
                    onChange={(e) => this.handleUserErrorDescriptionChange(e)}
                    value={this.state.userErrorDescription}
                  />
                </Fragment>
                :
                null
              }
            </Modal.Body>
            <Modal.Footer>
              {this.state.isUnknownError ?
                <Fragment>
                  <Button
                    variant="success"
                    type="submit"
                    className="float-right"
                    onClick={this.reportError}
                  >Report Error</Button>
                  <Button
                    variant="primary"
                    className="float-right"
                    onClick={this.closeError}
                  >Continue Without Reporting</Button>
                </Fragment>
                :
                <Button
                  variant="primary"
                  className="float-right"
                  onClick={this.closeError}
                >Ok</Button>
              }
            </Modal.Footer>
          </Modal>
          :
          null
        }
        <Navbar
          bg="light"
          expand="true"
          fixed="bottom"
          className="copyright-footer"
        >
          <small>Version: {this.state.commit_hash}<br />&copy; {this.state.copy_year} Thomas Yoho</small>
        </Navbar>
      </div >
    );
  }
}

export default App;
