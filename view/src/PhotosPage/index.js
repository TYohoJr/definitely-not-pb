import { Component, Fragment } from 'react';
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
            selectedPhotoAlbumIDs: [],
            isLoading: false,
            selectedPhoto: null,
        }
    }

    componentDidMount() {
        this.getPhotos()
        this.props.getAlbums()
    }

    getSelectedPhotoAlbums = async (photo) => {
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
                this.setState({ selectedPhotoAlbumIDs: albumIDs });
            }
        });
    }

    handleSelectedFileDescriptionChange = (e) => {
        this.setState({ selectedFileDescription: e.target.value })
    }

    closeUploadModal = () => {
        this.setState({ showUpload: false, selectedFile: null, selectedFileDescription: "" })
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
                        let uploadTime = new Date(respJSON[i].uploaded_timestamp)
                        var obj = respJSON[i];
                        obj.photo_url = url
                        obj.uploaded_timestamp = uploadTime.toDateString()
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

    downloadPhoto = async (photoID) => {
        this.setState({ isLoading: true }, async () => {
            const token = localStorage.getItem('token');
            await fetch("/api/photo/download/id/" + encodeURIComponent(photoID), {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            }).then(async (resp) => {
                let respObj
                if (resp.status !== 200) {
                    respObj = {
                        status: resp.status,
                    }
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    respObj = {
                        filename: this.fileNameFromCDHeader(resp.headers.get('Content-Disposition')),
                        blob: await resp.blob(),
                        contentType: resp.headers.get("Content-Type"),
                        status: resp.status,
                    }
                }
                return respObj
            }).then(async resp => {
                if (resp.status === 200) {
                    const newBlob = new Blob([resp.blob], { type: resp.contentType }); // It is necessary to create a new blob object with mime-type explicitly set for all browsers except Chrome, but it works for Chrome too.
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) { // MS Edge and IE don't allow using a blob object directly as link href, instead it is necessary to use msSaveOrOpenBlob
                        window.navigator.msSaveOrOpenBlob(newBlob);
                    } else { // For other browsers: create a link pointing to the ObjectURL containing the blob.
                        let objURL = window.URL.createObjectURL(newBlob);
                        let link = document.createElement('a');
                        link.href = objURL;
                        link.download = resp.filename;
                        link.click();
                        setTimeout(() => { window.URL.revokeObjectURL(objURL); }, 250); // For Firefox it is necessary to delay revoking the ObjectURL.
                    }
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    fileNameFromCDHeader = (header) => {
        let contentDispostion = header.split(';');
        const fileNameToken = `filename=`;
        let fileName = 'download.pdf';
        for (let thisValue of contentDispostion) {
            if (thisValue.trim().indexOf(fileNameToken) === 0) {
                fileName = decodeURIComponent(thisValue.trim().replace(fileNameToken, ''));
                break;
            }
        }
        return fileName;
    };

    viewPhoto = async (photo) => {
        this.setState({ isLoading: true, selectedPhoto: photo }, async () => {
            await this.getSelectedPhotoAlbums(this.state.selectedPhoto)
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
            let url = "https://www.generationsforpeace.org/wp-content/uploads/2018/03/empty.jpg"
            if (resp.status === 200) {
                url = await resp.json();
            }
            return url
        });
    }

    addPhotoToAlbum = async (album) => {
        if (!this.state.selectedPhoto || !album) {
            return
        }
        const token = localStorage.getItem('token');
        let albumPhotoData = {
            album_id: album.id,
            photo_id: this.state.selectedPhoto.id
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
                await this.getSelectedPhotoAlbums(this.state.selectedPhoto)
            }
        });
    }

    removePhotoFromAlbum = async (album) => {
        if (!this.state.selectedPhoto || !album) {
            return
        }
        const token = localStorage.getItem('token');
        let albumPhotoData = {
            album_id: album.id,
            photo_id: this.state.selectedPhoto.id
        }
        await fetch("/api/album_photo/", {
            method: "DELETE",
            headers: {
                "content-type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(albumPhotoData)
        }).then(async (resp) => {
            if (resp.status !== 204) {
                let errorMsg = await resp.text();
                this.props.displayError(errorMsg, true);
            } else {
                await this.getSelectedPhotoAlbums(this.state.selectedPhoto)
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
                        variant="secondary"
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
                        <Modal.Header
                            className="display-block"
                        >
                            <Modal.Title className="float-left">Upload Photo</Modal.Title>
                            <Button // close
                                type="button"
                                variant="secondary"
                                className="float-right"
                                onClick={this.closeUploadModal}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                    <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z" />
                                </svg>
                            </Button>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId="formFile" className="mb-3">
                                <Form.Label
                                    className="upload-form-label"
                                >Upload File:</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={this.changeFile}
                                />
                                <Form.Label
                                    className="upload-form-label upload-form-description-label"
                                >Description:</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Optional description of photo"
                                    maxLength={200}
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
                                <Fragment>
                                    <Button
                                        variant="success"
                                        className="float-center"
                                        onClick={() => this.uploadPhoto(this.state.selectedFile)}
                                    >
                                        Upload
                                    </Button>
                                </Fragment>
                            }
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
                        backdrop="static"
                        centered
                    >
                        <Modal.Header>
                            <Button // delete
                                variant="danger"
                                type="button"
                                onClick={() => this.deletePhoto(this.state.selectedPhoto.id)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                </svg>
                            </Button>{' '}
                            <Button // download
                                variant="primary"
                                type="button"
                                onClick={() => this.downloadPhoto(this.state.selectedPhoto.id)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                                </svg>
                            </Button>{' '}
                            <Button // close
                                type="button"
                                variant="secondary"
                                onClick={() => this.setState({ showPicture: false })}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                    <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z" />
                                </svg>
                            </Button>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="view-photo-container">
                                <img className="view-photo-img" alt="" src={this.state.selectedPhotoURL} />
                            </div>
                        </Modal.Body>
                        <Modal.Footer
                            className="photo-details-footer"
                        >
                            {this.state.isLoading ?
                                <Fragment>
                                    <span className="photo-details">
                                        <b>File Name:</b> {this.state.selectedPhoto.name}<br />
                                        <b>Description:</b> {this.state.selectedPhoto.description}<br />
                                        <b>Uploaded Date:</b> {this.state.selectedPhoto.uploaded_timestamp}<br />
                                    </span>
                                    <Spinner
                                        animation="border"
                                        role="status"
                                        className="float-right"
                                    >
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </Fragment>
                                :
                                <Fragment>
                                    <span className="photo-details">
                                        <b>File Name:</b> {this.state.selectedPhoto.name}<br />
                                        <b>Description:</b> {this.state.selectedPhoto.description}<br />
                                        <b>Upload Date:</b> {this.state.selectedPhoto.uploaded_timestamp}<br />
                                        <b>Albums:</b><br />
                                    </span>
                                    <span className="photo-btns-container">
                                        <ul className="album-list">
                                            {this.props.albums.sort((a, b) => {
                                                if (this.state.selectedPhotoAlbumIDs.indexOf(a.id) !== -1 && this.state.selectedPhotoAlbumIDs.indexOf(b.id) === -1) { // already added and next one isnt
                                                    return -1
                                                } else if (this.state.selectedPhotoAlbumIDs.indexOf(a.id) === -1 && this.state.selectedPhotoAlbumIDs.indexOf(b.id) !== -1) { // not added and next one is
                                                    return 1
                                                } else { // neither are already added or both are already added
                                                    if (a.name < b.name) {
                                                        return -1
                                                    } else if (a.name > b.name) {
                                                        return 1
                                                    }
                                                    return 0
                                                }
                                            }).map((album, i) => {
                                                if (this.state.selectedPhotoAlbumIDs.indexOf(album.id) !== -1) {
                                                    return <li
                                                        className="album-li"
                                                        key={i}
                                                    >
                                                        <span className="album-li-name">
                                                            {album.name}
                                                        </span>
                                                        <Button // Add disabled
                                                            type="button"
                                                            variant="secondary"
                                                            className="float-right album-li-btn"
                                                            disabled={true}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                                                                <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
                                                            </svg>
                                                        </Button>
                                                        <Button // Subtract
                                                            type="button"
                                                            variant="danger"
                                                            className="float-right album-li-btn"
                                                            onClick={() => this.removePhotoFromAlbum(album)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
                                                                <path d="M0 8a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1z" />
                                                            </svg>
                                                        </Button>
                                                    </li>
                                                } else {
                                                    return <li
                                                        className="album-li"
                                                        key={i}
                                                    >
                                                        <span className="album-li-name">
                                                            {album.name}
                                                        </span>
                                                        <Button // Add
                                                            type="button"
                                                            variant="success"
                                                            className="float-right album-li-btn"
                                                            onClick={() => this.addPhotoToAlbum(album)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                                                                <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
                                                            </svg>
                                                        </Button>
                                                        <Button // Subtract disabled
                                                            type="button"
                                                            variant="secondary"
                                                            className="float-right album-li-btn"
                                                            disabled={true}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
                                                                <path d="M0 8a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1z" />
                                                            </svg>
                                                        </Button>
                                                    </li>
                                                }
                                            })}
                                        </ul>
                                    </span>
                                </Fragment>
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