import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';

class AlbumsPage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            albums: [],
            newAlbumName: "",
            isValidAlbumName: true,
            isCreatingNewAlbum: false,
            showUpload: false,
            selectedFile: null,
            selectedAlbumID: 0,
        }
    }

    componentDidMount() {
        this.props.getAlbums()
    }

    // getAlbums = async () => {
    //     await fetch("/api/album/user/" + encodeURIComponent(this.props.appUserID), {
    //         method: "GET",
    //         headers: {
    //             "content-type": "application/json",
    //         }
    //     }).then(async (resp) => {
    //         if (resp.status !== 200) {
    //             console.error("bad response code: ", resp.status)
    //         } else {
    //             let respJSON = await resp.json();
    //             console.log(respJSON)
    //             this.setState({ albums: respJSON })
    //         }
    //     })
    // }

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
        // await fetch("/api/album/user/" + encodeURIComponent(this.props.appUserID), {
        //     method: "GET",
        //     headers: {
        //         "content-type": "application/json",
        //     }
        // }).then(async (resp) => {
        //     if (resp.status !== 200) {
        //         console.error("bad response code: ", resp.status)
        //     } else {
        //         let respJSON = await resp.json();
        //         console.log(respJSON)
        //         this.setState({ albums: respJSON })
        //     }
        // })
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
            </div>
        )
    }
}

export default AlbumsPage;