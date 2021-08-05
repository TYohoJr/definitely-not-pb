import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
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
            isLoading: false,
            selectedPhoto: null,
        }
    }

    componentDidMount() {
        this.getPhotos()
        this.props.getAlbums()
    }

    handleShowChooseAlbum = async (photo) => {
        const token = localStorage.getItem('token');
        await fetch("/api/album/photo/" + encodeURIComponent(photo.id), {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                let errorMsg = await resp.text();
                this.props.displayError(errorMsg, true);
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

    closeUploadModal = () => {
        this.setState({ showUpload: false, selectedFile: null, selectedFileDescription: "" })
    }

    handleChooseAlbumChange = (e) => {
        this.setState({ selectedAlbum: this.props.albums[e.target.value] })
    }

    getPhotos = async () => {
        const token = localStorage.getItem('token');
        await fetch("/api/photo/user/" + encodeURIComponent(this.props.appUserID), {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                let errorMsg = await resp.text();
                this.props.displayError(errorMsg, true);
            } else {
                let respJSON = await resp.json();
                this.setState({ photos: [] }, async () => {
                    for (let i = 0; i < respJSON.length; i++) {
                        let photos = this.state.photos
                        console.log("loaded photo", respJSON[i])
                        let url = await this.getPhotoURL(respJSON[i]);
                        var obj = respJSON[i];
                        obj.photo_url = url
                        photos.push(obj)
                        this.setState({ photos: photos })
                    }
                })
            }
        })
    }

    deletePhoto = async (photoID) => {
        this.setState({ isLoading: true }, async () => {
            const token = localStorage.getItem('token');
            await fetch("/api/photo/id/" + encodeURIComponent(photoID), {
                method: "DELETE",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            }).then(async (resp) => {
                if (resp.status !== 204) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    await this.getPhotos()
                }
            }).finally(() => {
                this.setState({ isLoading: false, showPicture: false });
            });
        })
    }

    viewPhoto = async (photo) => {
        this.setState({ isLoading: true, selectedPhoto: photo }, async () => {
            const token = localStorage.getItem('token');
            await fetch("/api/photo/id/" + encodeURIComponent(photo.id), {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            }).then(async (resp) => {
                if (resp.status !== 200) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    let respJSON = await resp.json();
                    this.setState({ selectedPhotoURL: respJSON }, () => {
                        this.setState({ showPicture: true })
                    })
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    getPhotoURL = async (photo) => {
        const token = localStorage.getItem('token');
        return await fetch("/api/photo/id/" + encodeURIComponent(photo.id), {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        }).then(async (resp) => {
            let url = ""
            if (resp.status === 200) {
                url = await resp.json();
            } else {
                let respErr = await resp.text();
                console.log("error: ", respErr)
            }
            return url
        });
    }

    addPhotoToAlbum = async () => {
        if (!this.state.photoToAddToAlbum || !this.state.selectedAlbum) {
            return
        }
        const token = localStorage.getItem('token');
        let albumPhotoData = {
            album_id: this.state.selectedAlbum.id,
            photo_id: this.state.photoToAddToAlbum.id
        }
        await fetch("/api/album_photo/", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(albumPhotoData)
        }).then(async (resp) => {
            if (resp.status !== 201) {
                let errorMsg = await resp.text();
                this.props.displayError(errorMsg, true);
            } else {
                this.setState({ showChooseAlbum: false }, () => {
                    this.props.getAlbums()
                })
            }
        });
    }

    uploadPhoto = async (file) => {
        if (file) {
            this.setState({ isLoading: true }, async () => {
                const token = localStorage.getItem('token');
                let photoData = {
                    app_user_id: this.props.appUserID,
                    name: file.name,
                    description: this.state.selectedFileDescription,
                    file_type: ""
                }
                await fetch("/api/photo/file_name/" + encodeURIComponent(file.name), {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    body: file
                }).then(async (resp) => {
                    if (resp.status !== 201) {
                        let errorMsg = await resp.text();
                        this.props.displayError(errorMsg, true);
                    } else {
                        photoData.file_type = await resp.text();
                        await fetch("/api/photo", {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify(photoData)
                        }).then(async (resp) => {
                            if (resp.status !== 204) {
                                let errorMsg = await resp.text();
                                this.props.displayError(errorMsg, true);
                            } else {
                                this.setState({
                                    selectedFileDescription: "",
                                    selectedFile: null,
                                    showUpload: false,
                                }, () => {
                                    this.getPhotos();
                                });
                            }
                        });
                    }
                }).finally(() => {
                    this.setState({ isLoading: false });
                });
            })
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
                        className="top-btn upload-btn"
                        onClick={() => this.setState({ showUpload: true })}
                    >
                        Upload Photo
                    </Button>
                </div>
                <Container>
                    {this.state.photos.map((photo, i) => {
                        return (
                            <Card
                                bg="Light"
                                key={i}
                                text="dark"
                                style={{
                                    width: '18rem',
                                    height: '18rem',
                                    backgroundImage: `url(${photo.photo_url})`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                                className="mb-2"
                            >
                                <Card.Body>
                                </Card.Body>
                                <Card.Footer className="text-muted">
                                    <Button
                                        variant="primary"
                                        type="button"
                                        onClick={() => this.viewPhoto(photo)}
                                    >
                                        Manage
                                    </Button>
                                </Card.Footer>
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
                            {this.state.isLoading ?
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                :
                                <span>
                                    <Button
                                        variant="success"
                                        className="float-right"
                                        onClick={() => this.uploadPhoto(this.state.selectedFile)}
                                    >
                                        Upload
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="float-left"
                                        onClick={this.closeUploadModal}
                                    >
                                        Cancel
                                    </Button>
                                </span>
                            }
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
                                <img className="view-photo-img" alt="" src={this.state.selectedPhotoURL} />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <span className="photo-details"><b>FileName:</b> {this.state.selectedPhoto.name}<br /><b>Description:</b> {this.state.selectedPhoto.description}</span>
                            {this.state.isLoading ?
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                :
                                <span className="photo-btns-container">
                                    <Button
                                        variant="success"
                                        type="button"
                                        onClick={() => this.handleShowChooseAlbum(this.state.selectedPhoto)}
                                    >
                                        Add To Album
                                    </Button>{' '}
                                    <Button
                                        variant="danger"
                                        type="button"
                                        onClick={() => this.deletePhoto(this.state.selectedPhoto.id)}
                                    >
                                        Delete
                                    </Button>{' '}
                                    <Button
                                        onClick={() => this.setState({ showPicture: false })}
                                    >
                                        Close
                                    </Button>
                                </span>
                            }
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