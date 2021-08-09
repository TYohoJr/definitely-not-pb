import React, { Component, Fragment } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ImageGallery from 'react-image-gallery';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import "react-image-gallery/styles/css/image-gallery.css";
import "./index.css";

class AlbumsPage extends Component {
    constructor(props) {
        super(props)
        this.imageGalleryRef = React.createRef();
        this.state = {
            newAlbumName: "",
            isValidAlbumName: true,
            isCreatingNewAlbum: false,
            isDisplayingAlbum: false,
            albumGalleryImages: [],
            isGalleryLoaded: false,
            isLoading: false,
            isLoadingIndex: -1,
        }
    }

    componentDidMount() {
        this.props.getAlbums()
    }

    deleteAlbum = async (albumID, i) => {
        this.setState({ isLoading: true, isLoadingIndex: i }, async () => {
            const token = localStorage.getItem('token');
            await fetch("/api/album/id/" + encodeURIComponent(albumID), {
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
                    this.props.getAlbums()
                }
            }).finally(() => {
                this.setState({ isLoadingIndex: -1, isLoading: false });
            });
        })
    }

    openAlbum = async (albumID, i) => {
        this.setState({ isLoading: true, isLoadingIndex: i }, async () => {
            const token = localStorage.getItem('token');
            await fetch("/api/album_photo/album/" + encodeURIComponent(albumID), {
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
                    if (respJSON.length > 0) {
                        for (let i = 0; i < respJSON.length; i++) {
                            await this.addPhotoToAlbum(respJSON[i].photo_id)
                        }
                        this.setState({ isDisplayingAlbum: true })
                    } else {
                        let errorMsg = "album is empty"
                        this.props.displayError(errorMsg, false);
                    }
                }
            }).finally(() => {
                this.setState({ isLoadingIndex: -1, isLoading: false });
            });
        })
    }

    addPhotoToAlbum = async (photoID) => {
        const token = localStorage.getItem('token');
        await fetch("/api/photo/id/" + encodeURIComponent(photoID), {
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
                let images = this.state.albumGalleryImages
                images.push({
                    original: respJSON,
                });
                this.setState({ albumGalleryImages: images }, () => {
                    return
                });
            }
        });
    }

    createAlbum = async () => {
        if (!this.state.newAlbumName || !this.state.isValidAlbumName) {
            return
        }
        this.setState({ isLoading: true }, async () => {
            let albumData = {
                name: this.state.newAlbumName,
                app_user_id: this.props.appUserID,
            }
            const token = localStorage.getItem('token');
            await fetch("/api/album", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(albumData)
            }).then(async (resp) => {
                if (resp.status !== 201) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    this.setState({ isCreatingNewAlbum: false, newAlbumName: "" }, () => {
                        this.props.getAlbums()
                    })
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    handleNewAlbumNameChange = async (e) => {
        this.setState({ newAlbumName: e.target.value }, async () => {
            if (this.state.newAlbumName) {
                const token = localStorage.getItem('token');
                await fetch("/api/album/user/" + encodeURIComponent(this.props.appUserID) + "/name/" + encodeURIComponent(this.state.newAlbumName), {
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
                        if (respJSON.length > 0) {
                            this.setState({ isValidAlbumName: false })
                        } else {
                            this.setState({ isValidAlbumName: true })
                        }
                    }
                })
            } else {
                this.setState({ isValidAlbumName: true })
            }

        })
    }

    onImageLoad = (e) => {
        if (!this.state.isGalleryLoaded) {
            this.setState({ isGalleryLoaded: true }, () => {
                this.imageGalleryRef.current.fullScreen()
            });
        }
    }

    onScreenChange = (isFullScreen) => {
        if (!isFullScreen) {
            this.setState({ isGalleryLoaded: false, isDisplayingAlbum: false, albumGalleryImages: [] });
        }
    }

    render() {
        return (
            <div>
                <div class="top-btns-container">
                    <Button
                        variant="primary"
                        type="button"
                        className="top-btn"
                        onClick={() => this.setState({ isCreatingNewAlbum: true })}
                    >
                        Create New Album
                    </Button>
                </div>
                {this.state.isCreatingNewAlbum ?
                    <Modal
                        show={true}
                        size="lg"
                        aria-labelledby="contained-modal-title-vcenter"
                        centered
                        backdrop="static"
                    >
                        <Modal.Body>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Album Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Username"
                                    maxLength={50}
                                    required={true}
                                    onChange={(e) => this.handleNewAlbumNameChange(e)}
                                    value={this.state.newAlbumName}
                                />
                                <Form.Text className="text-muted">
                                    <ul className="pass-req-list input-warning">
                                        {!this.state.newAlbumName ?
                                            <li className="req-not-met">Album name cannot be empty</li>
                                            :
                                            null
                                        }
                                        {!this.state.isValidAlbumName ?
                                            <li className="req-not-met">Album name already taken</li>
                                            :
                                            null
                                        }
                                    </ul>
                                </Form.Text>
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
                                        variant="secondary"
                                        type="button"
                                        className="float-left"
                                        onClick={() => this.setState({ newAlbumName: "", isCreatingNewAlbum: false })}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="success"
                                        type="button"
                                        className="float-right"
                                        onClick={this.createAlbum}
                                    >
                                        Create
                                    </Button>
                                </Fragment>
                            }
                        </Modal.Footer>
                    </Modal>
                    :
                    null
                }
                <Container>
                    {this.props.albums.map((album, i) => {
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
                                <Card.Title>{album.name}</Card.Title>
                                <Card.Body
                                    style={{
                                        width: '18rem',
                                        height: '18rem',
                                        backgroundImage: `url(${album.photo_url})`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                                <Card.Footer>
                                    {this.state.isLoading && this.state.isLoadingIndex === i ?
                                        <Spinner animation="border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </Spinner>
                                        :
                                        <Fragment>
                                            <Button // delete
                                                variant="danger"
                                                type="button"
                                                className="float-left"
                                                onClick={() => this.deleteAlbum(album.id, i)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                </svg>
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="button"
                                                className="float-right"
                                                onClick={() => this.openAlbum(album.id, i)}
                                            >
                                                Open
                                            </Button>
                                        </Fragment>
                                    }
                                </Card.Footer>
                            </Card>
                        )
                    })}
                </Container>
                {this.state.isDisplayingAlbum ?
                    <ImageGallery
                        items={this.state.albumGalleryImages}
                        showThumbnails={false}
                        showPlayButton={false}
                        onImageLoad={this.onImageLoad}
                        ref={this.imageGalleryRef}
                        onScreenChange={this.onScreenChange}
                        useTranslate3D={false}
                    />
                    :
                    null
                }
            </div>
        )
    }
}

export default AlbumsPage;