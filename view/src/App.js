import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {
  constructor() {
    super()
    this.state = {
      buckets: [],
      objects: [],
      showNoObjs: false,
      showDeletedObj: false,
      showError: false,
      errorMsg: "Unkown error occurred",
      showUpload: false,
      showSuccessUpload: false,
      selectedBucket: "",
      selectedFile: null,
      showCreateBucket: false,
      createBucketName: "",
      showSuccessBucket: false,
      showDeletedBucket: false
    }
  }

  componentDidMount() {
    this.getBuckets();
  }

  getBuckets = async () => {
    await fetch("/api/buckets", {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    }).then(async (resp) => {
      if (resp.status != 200) {
        resp.text().then((text) => {
          this.setState({ errorMsg: text }, () => {
            this.setState({ showError: true })
          })
        })
      } else {
        let respJSON = await resp.json();
        this.setState({ buckets: respJSON });
      }
    })
  };

  getObjects = async (bcktName) => {
    await fetch("/api/objects/bucket/" + encodeURIComponent(bcktName), {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    }).then(async (resp) => {
      if (resp.status != 200) {
        resp.text().then((text) => {
          this.setState({ errorMsg: text }, () => {
            this.setState({ showError: true })
          })
        })
      } else {
        let respJSON = await resp.json();
        this.setState({ objects: respJSON, selectedBucket: bcktName });
        if (respJSON.length == 0) {
          this.setState({ showNoObjs: true })
        }
      }
    })
  };

  downloadObject = async (bcktName, objKey) => {
    await fetch("/api/objects/bucket/" + encodeURIComponent(bcktName) + "/key/" + encodeURIComponent(objKey), {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    })
      .then(async (resp) => {
        if (resp.status != 200) {
          resp.text().then((text) => {
            this.setState({ errorMsg: text }, () => {
              this.setState({ showError: true }, () => {

              })
            })
          })
        }
        return resp
      })
      .then(async res => ({
        filename: this.fileNameFromCDHeader(res.headers.get('content-disposition')),
        blob: await res.blob(),
        contentType: res.headers.get("content-type")
      }))
      .then(resp => {
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
      });
  };

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

  deleteObject = async (bcktName, objKey) => {
    await fetch("/api/objects/bucket/" + encodeURIComponent(bcktName) + "/key/" + encodeURIComponent(objKey), {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
    }).then((resp) => {
      if (resp.status != 204) {
        resp.text().then((text) => {
          this.setState({ errorMsg: text }, () => {
            this.setState({ showError: true })
          })
        })
      } else {
        this.setState({ showDeletedObj: true });
        this.getObjects(bcktName);
      }
    })
  };

  uploadFile = async (bcktName, file) => {
    await fetch("/api/objects/bucket/" + encodeURIComponent(bcktName) + "/key/" + encodeURIComponent(file.name), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: file
    }).then((resp) => {
      if (resp.status != 201) {
        resp.text().then((text) => {
          this.setState({ errorMsg: text }, () => {
            this.setState({ showUpload: false }, () => {
              this.setState({ showError: true })
            })
          })
        })
      } else {
        this.setState({ showUpload: false, showSuccessUpload: true });
        this.getObjects(bcktName);
      }
    })
  };

  createBucket = async (bcktName) => {
    await fetch("/api/objects/bucket/" + encodeURIComponent(bcktName), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    }).then((resp) => {
      if (resp.status != 201) {
        resp.text().then((text) => {
          this.setState({ errorMsg: text }, () => {
            this.setState({ showCreateBucket: false }, () => {
              this.setState({ showError: true })
            })
          })
        })
      } else {
        this.setState({ showCreateBucket: false, showSuccessBucket: true });
        this.getBuckets();
      }
    })
  };

  deleteBucket = async (bcktName) => {
    await fetch("/api/objects/bucket/" + encodeURIComponent(bcktName), {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
    }).then((resp) => {
      if (resp.status != 204) {
        resp.text().then((text) => {
          this.setState({ errorMsg: text }, () => {
            this.setState({ showError: true })
          })
        })
      } else {
        this.setState({ showDeletedBucket: true });
        this.getBuckets();
      }
    })
  };

  changeFile = async (e) => {
    if (e.target.files.length > 0) {
      this.setState({ selectedFile: e.target.files[0] })
    }
  };

  changeBucketName = async (e) => {
    this.setState({ createBucketName: e.target.value })
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            {this.state.objects.length < 1 ? (
              <div>
                <Alert variant="primary" show={true}>Buckets:</Alert>
                {this.state.buckets.map((bckt, i) => {
                  return (
                    <div
                      key={i}
                    >
                      <Alert variant="primary" show={true}>
                        <Alert.Heading>{bckt["bucket_name"]}</Alert.Heading>
                        <hr />
                        <ButtonGroup aria-label="Object Options">{' '}
                          <Button
                            variant="primary"
                            onClick={() => this.getObjects(bckt["bucket_name"])}
                          >
                            View Objects
                          </Button>{' '}
                          <Button
                            variant="danger"
                            onClick={() => this.deleteBucket(bckt["bucket_name"])}
                          >
                            Delete
                          </Button>{' '}
                        </ButtonGroup>
                      </Alert >{' '}
                    </div>
                  );
                })}
                <br />
                <Button
                  variant="warning"
                  onClick={() => this.setState({ showCreateBucket: true })}
                >
                  Create Bucket
                </Button>
              </div>
            ) : (
              <div>
                <Alert variant="primary" show={true}>Objects:</Alert>
                {this.state.objects.map((obj, i) => {
                  return (
                    <div
                      key={i}
                    >
                      <Alert variant="primary" show={true}>
                        <Alert.Heading>{obj["object_key"]}</Alert.Heading>
                        <hr />
                        <ButtonGroup aria-label="Object Options">{' '}
                          <Button
                            variant="success"
                            onClick={() => this.downloadObject(obj["bucket_name"], obj["object_key"])}
                          >
                            Download
                          </Button>{' '}
                          <Button
                            variant="danger"
                            onClick={() => this.deleteObject(obj["bucket_name"], obj["object_key"])}
                          >
                            Delete
                          </Button>{' '}
                        </ButtonGroup>
                      </Alert >{' '}
                    </div>
                  );
                })}
                <br />
                <Button
                  variant="warning"
                  onClick={() => this.setState({ showUpload: true })}
                >
                  Upload File
                </Button>
                <br />
                <Button
                  variant="secondary"
                  onClick={() => this.setState({ objects: [] })}
                >
                  Return To Buckets
                </Button>
              </div>
            )}
            <br />
            <br />
            <Modal
              show={this.state.showUpload}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>Upload File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={this.changeFile}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.uploadFile(this.state.selectedBucket, this.state.selectedFile)}>Upload</Button>
                <Button onClick={() => this.setState({ showUpload: false })}>Cancel</Button>
              </Modal.Footer>
            </Modal>
            {/*  */}
            <Modal
              show={this.state.showCreateBucket}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>Create Bucket</Form.Label>
                  <Form.Control
                    type='text'
                    name='bucket'
                    placeholder='Enter Bucket Name'
                    onChange={this.changeBucketName}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.createBucket(this.state.createBucketName)}>Create</Button>
                <Button onClick={() => this.setState({ showCreateBucket: false })}>Cancel</Button>
              </Modal.Footer>
            </Modal>
            {/*  */}
            <Modal
              show={this.state.showNoObjs}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <h4>No objects within bucket</h4>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.setState({ showNoObjs: false })}>Close</Button>
              </Modal.Footer>
            </Modal>
            <Modal
              show={this.state.showDeletedObj}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <h4>Object deleted successfully</h4>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.setState({ showDeletedObj: false })}>Close</Button>
              </Modal.Footer>
            </Modal>
            <Modal
              show={this.state.showDeletedBucket}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <h4>Bucket deleted successfully</h4>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.setState({ showDeletedBucket: false })}>Close</Button>
              </Modal.Footer>
            </Modal>
            <Modal
              show={this.state.showSuccessUpload}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <h4>Object uploaded successfully</h4>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.setState({ showSuccessUpload: false })}>Close</Button>
              </Modal.Footer>
            </Modal>
            <Modal
              show={this.state.showSuccessBucket}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <h4>Bucket created successfully</h4>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.setState({ showSuccessBucket: false })}>Close</Button>
              </Modal.Footer>
            </Modal>
            <Modal
              show={this.state.showError}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Body>
                <h4>Error Occured: {this.state.errorMsg}</h4>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.setState({ showError: false })}>Close</Button>
              </Modal.Footer>
            </Modal>
          </div>
        </header>
      </div>
    );
  }
}

export default App;
