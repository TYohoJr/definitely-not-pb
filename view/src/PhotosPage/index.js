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
                                bg="card"
                                key={i}
                                text="dark"
                                style={{
                                    width: '18rem',
                                }}
                                className="mb-2"
                            >
                                <Card.Title>{photo.name}</Card.Title>
                                <Card.Body
                                    style={{
                                        width: '18rem',
                                        height: '18rem',
                                        backgroundImage: `url(${photo.photo_url})`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
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
                                    accept="image/*"
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
                            <Button
                                variant="success"
                                className="float-right"
                                onClick={() => this.addPhotoToAlbum()}
                            >
                                Add
                            </Button>
                            <Button
                                variant="primary"
                                className="float-left"
                                onClick={() => this.setState({ selectedAlbum: null, photoToAddToAlbum: null, showChooseAlbum: false })}
                            >
                                Close
                            </Button>
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
                            {this.state.isLoading ?
                                <span>
                                    <span className="photo-details"><b>FileName:</b> {this.state.selectedPhoto.name}<br /><b>Description:</b> {this.state.selectedPhoto.description}</span>
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </span>
                                :
                                <span>
                                    <Button
                                        variant="danger"
                                        type="button"
                                        className="float-left"
                                        style={{
                                            marginRight: '1em',
                                        }}
                                        onClick={() => this.deletePhoto(this.state.selectedPhoto.id)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                        </svg>
                                    </Button>{' '}
                                    <span className="photo-details"><b>FileName:</b> {this.state.selectedPhoto.name}<br /><b>Description:</b> {this.state.selectedPhoto.description}</span>
                                    <span className="photo-btns-container">
                                        <Button
                                            variant="success"
                                            type="button"
                                            onClick={() => this.handleShowChooseAlbum(this.state.selectedPhoto)}
                                        >
                                            Add To Album
                                        </Button>{' '}

                                        <Button
                                            onClick={() => this.setState({ showPicture: false })}
                                        >
                                            Close
                                        </Button>
                                    </span>
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