import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import './index.css';

class PhotosPage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            photos: [],
            showUpload: false,
            selectedFile: null,
            selectedFileDescription: "",
            selectedPhotoURL: "",
            photoToAddToAlbum: null,
            selectedAlbum: null,
            selectedPhotoAlbumIDs: [],
            showChooseAlbum: false,
        }
    }

    componentDidMount() {
        this.getPhotos()
        this.props.getAlbums()
    }

    handleShowChooseAlbum = async (photo) => {
        await fetch("/api/album/photo/" + encodeURIComponent(photo.id), {
            method: "GET",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                console.error("bad response code: ", resp.status)
            } else {
                let respJSON = await resp.json();
                let albumIDs = []
                respJSON.forEach((album, i) => {
                    albumIDs.push(album.id)
                });
                this.setState({ selectedPhotoAlbumIDs: albumIDs }, () => {
                    this.setState({ photoToAddToAlbum: photo }, () => {
                        this.setState({ showChooseAlbum: true })
                    })
                });
            }
        });
    }

    handleSelectedFileDescriptionChange = (e) => {
        this.setState({ selectedFileDescription: e.target.value })
    }

    handleChooseAlbumChange = (e) => {
        this.setState({ selectedAlbum: this.props.albums[e.target.value] })
    }

    getPhotos = async () => {
        await fetch("/api/photo/user/" + encodeURIComponent(this.props.appUserID), {
            method: "GET",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                console.error("bad response code: ", resp.status)
            } else {
                let respJSON = await resp.json();
                this.setState({ photos: respJSON })
            }
        })
    }

    deletePhoto = async (photoID) => {
        await fetch("/api/photo/id/" + encodeURIComponent(photoID), {
            method: "DELETE",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 204) {
                console.error("bad response code: ", resp.status)
            } else {
                this.getPhotos()
            }
        })
    }

    viewPhoto = async (photo) => {
        await fetch("/api/photo/id/" + encodeURIComponent(photo.id), {
            method: "GET",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                console.error("bad response code: ", resp.status)
            } else {
                let respJSON = await resp.json();
                this.setState({ selectedPhotoURL: respJSON }, () => {
                    this.setState({ showPicture: true })
                })
            }
        })
    }

    addPhotoToAlbum = async () => {
        if (!this.state.photoToAddToAlbum || !this.state.selectedAlbum) {
            return
        }
        let albumPhotoData = {
            album_id: this.state.selectedAlbum.id,
            photo_id: this.state.photoToAddToAlbum.id
        }
        await fetch("/api/album_photo/", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(albumPhotoData)
        }).then((resp) => {
            if (resp.status !== 201) {
                console.error("bad response code: ", resp.status)
            } else {
                this.setState({ showChooseAlbum: false }, () => {
                    this.props.getAlbums()
                })
            }
        });
    }

    uploadPhoto = async (file) => {
        if (file) {
            let photoData = {
                app_user_id: this.props.appUserID,
                name: file.name,
                description: this.state.selectedFileDescription,
            }
            await fetch("/api/photo/file_name/" + encodeURIComponent(file.name), {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: file
            }).then(async (resp) => {
                if (resp.status !== 204) {
                    console.error("bad response code: ", resp.status)
                } else {
                    await fetch("/api/photo", {
                        method: "PUT",
                        headers: {
                            "content-type": "application/json",
                        },
                        body: JSON.stringify(photoData)
                    }).then((resp) => {
                        if (resp.status !== 204) {
                            console.error("bad response code: ", resp.status)
                        } else {
                            this.setState({
                                selectedFileDescription: "",
                                selectedFile: null,
                                showUpload: false
                            }, () => {
                                this.getPhotos();
                            });
                        }
                    });
                }
            });
        }
    }

    changeFile = async (e) => {
        if (e.target.files.length > 0) {
            this.setState({ selectedFile: e.target.files[0] })
        }
    };

    render() {
        return (
            <div>
                <div class="top-btns-container">
                    <Button
                        variant="primary"
                        type="button"
                        className="top-btn"
                        onClick={() => this.setState({ showUpload: true })}
                    >
                        Upload Photo
                    </Button>
                    <Button
                        variant="secondary"
                        type="button"
                        className="top-btn"
                        onClick={this.props.goBackToHomePage}
                    >
                        Go Back
                    </Button>
                </div>
                <Container>
                    {this.state.photos.map((photo, i) => {
                        return (
                            <Card
                                bg="Light"
                                key={i}
                                text="dark"
                                style={{ width: '18rem' }}
                                className="mb-2"
                            >
                                <Card.Body>
                                    <Card.Title>{photo.name}</Card.Title>
                                    <Card.Text>{photo.description}</Card.Text>
                                    <Button
                                        variant="primary"
                                        type="button"
                                        onClick={() => this.viewPhoto(photo)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        variant="success"
                                        type="button"
                                        onClick={() => this.handleShowChooseAlbum(photo)}
                                    >
                                        Add To Album
                                    </Button>
                                    <Button
                                        variant="danger"
                                        type="button"
                                        onClick={() => this.deletePhoto(photo.id)}
                                    >
                                        Delete
                                    </Button>
                                </Card.Body>
                            </Card>
                        )
                    })}
                </Container>
                {this.state.showUpload ?
                    <Modal
                        show={true}
                        size="lg"
                        aria-labelledby="contained-modal-title-vcenter"
                        centered
                        backdrop="static"
                    >
                        <Modal.Body>
                            <Form.Group controlId="formFile" className="mb-3">
                                <Form.Label
                                    className="upload-form-label"
                                >Upload File</Form.Label>
                                <Form.Control
                                    type="file"
                                    onChange={this.changeFile}
                                />
                                <Form.Label
                                    className="upload-form-label upload-form-description-label"
                                >Short Description</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Short Description"
                                    onChange={(e) => this.handleSelectedFileDescriptionChange(e)}
                                    value={this.state.selectedFileDescription}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="success" onClick={() => this.uploadPhoto(this.state.selectedFile)}>Upload</Button>
                            <Button variant="danger" onClick={() => this.setState({ showUpload: false })}>Cancel</Button>
                        </Modal.Footer>
                    </Modal>
                    :
                    null
                }
                {this.state.showChooseAlbum ?
                    <Modal
                        show={true}
                        size="lg"
                        aria-labelledby="contained-modal-title-vcenter"
                        centered
                        backdrop="static"
                    >
                        <Modal.Body>
                            <Form.Group controlId="formFile" className="mb-3">
                                <Form.Label className="upload-form-label">Photo Name</Form.Label>
                                <Form.Text>{this.state.photoToAddToAlbum ? this.state.photoToAddToAlbum.name : null}</Form.Text>
                                <Form.Label className="upload-form-label">Choose Album</Form.Label>
                                <Form.Control
                                    onChange={this.handleChooseAlbumChange}
                                    as="select"
                                >
                                    <option disabled selected value="">Select Album</option>
                                    {this.props.albums.map((album, i) => {
                                        if (this.state.selectedPhotoAlbumIDs.indexOf(album.id) !== -1) {
                                            return <option value={i} disabled>{album.name} - Already added</option>
                                        } else {
                                            return <option value={i}>{album.name}</option>
                                        }
                                    })}
                                </Form.Control>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={() => this.addPhotoToAlbum()}>Add</Button>
                            <Button onClick={() => this.setState({ selectedAlbum: null, photoToAddToAlbum: null, showChooseAlbum: false })}>Cancel</Button>
                        </Modal.Footer>
                    </Modal>
                    :
                    null
                }
                {this.state.showPicture ?
                    <Modal
                        show={true}
                        size="lg"
                        aria-labelledby="contained-modal-title-vcenter"
                        className="view-photo-modal"
                        centered
                    >
                        <Modal.Body>
                            <div className="view-photo-container">
                                <img className="view-photo-img" src={this.state.selectedPhotoURL} />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={() => this.setState({ showPicture: false })}>Close</Button>
                        </Modal.Footer>
                    </Modal>
                    :
                    null
                }
            </div>
        )
    }
}

export default PhotosPage;