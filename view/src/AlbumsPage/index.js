import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ImageGallery from 'react-image-gallery';
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
        }
    }

    componentDidMount() {
        this.props.getAlbums()
    }

    deleteAlbum = async (albumID) => {
        await fetch("/api/album/id/" + encodeURIComponent(albumID), {
            method: "DELETE",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 204) {
                console.error("bad response code: ", resp.status)
            } else {
                this.props.getAlbums()
            }
        })
    }

    openAlbum = async (albumID) => {
        await fetch("/api/album_photo/album/" + encodeURIComponent(albumID), {
            method: "GET",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                console.error("bad response code: ", resp.status)
            } else {
                let respJSON = await resp.json();
                for (let i = 0; i < respJSON.length; i++) {
                    await this.addPhotoToAlbum(respJSON[i].photo_id)
                }
                this.setState({ isDisplayingAlbum: true })
            }
        });
    }

    addPhotoToAlbum = async (photoID) => {
        await fetch("/api/photo/id/" + encodeURIComponent(photoID), {
            method: "GET",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                console.error("bad response code: ", resp.status)
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
        let albumData = {
            name: this.state.newAlbumName,
            app_user_id: this.props.appUserID,
        }
        await fetch("/api/album", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(albumData)
        }).then(async (resp) => {
            if (resp.status !== 201) {
                console.error("bad response code: ", resp.status)
            } else {
                this.setState({ isCreatingNewAlbum: false, newAlbumName: "" }, () => {
                    this.props.getAlbums()
                })
            }
        })
    }

    handleNewAlbumNameChange = async (e) => {
        this.setState({ newAlbumName: e.target.value }, async () => {
            if (this.state.newAlbumName) {
                await fetch("/api/album/user/" + encodeURIComponent(this.props.appUserID) + "/name/" + encodeURIComponent(this.state.newAlbumName), {
                    method: "GET",
                    headers: {
                        "content-type": "application/json",
                    }
                }).then(async (resp) => {
                    if (resp.status !== 200) {
                        console.error("bad response code: ", resp.status)
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
            this.setState({ isGalleryLoaded: false, isDisplayingAlbum: false });
        }
    }

    render() {
        return (
            <div>
                {this.props.albums.map((album, i) => {
                    return (
                        <Card
                            bg="Light"
                            key={i}
                            text="dark"
                            style={{ width: '18rem' }}
                            className="mb-2"
                        >
                            <Card.Body>
                                <Card.Title>{album.name}</Card.Title>
                                <Button
                                    variant="primary"
                                    type="button"
                                    onClick={() => this.openAlbum(album.id)}
                                >
                                    Open
                                </Button>
                                <Button
                                    variant="primary"
                                    type="button"
                                    onClick={() => this.deleteAlbum(album.id)}
                                >
                                    Delete
                                </Button>
                            </Card.Body>
                        </Card>
                    )
                })}
                {this.state.isCreatingNewAlbum ?
                    <div>
                        <Form>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Album Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Username"
                                    onChange={(e) => this.handleNewAlbumNameChange(e)}
                                    value={this.state.newAlbumName}
                                />
                                <Form.Text className="text-muted">
                                    <ul className="pass-req-list">
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
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => this.setState({ newAlbumName: "", isCreatingNewAlbum: false })}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="button"
                                onClick={this.createAlbum}
                            >
                                Create
                            </Button>
                        </Form>
                    </div>
                    :
                    <div>
                        <Button
                            variant="primary"
                            type="button"
                            onClick={() => this.setState({ isCreatingNewAlbum: true })}
                        >
                            Create New Album
                        </Button>
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={this.props.goBackToHomePage}
                        >
                            Go Back Home
                        </Button>
                    </div>
                }
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