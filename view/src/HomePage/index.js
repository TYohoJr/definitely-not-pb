import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';

class HomePage extends Component {
    render() {
        return (
            <div>
                <Container>
                    <Card
                        bg="Light"
                        text="dark"
                        style={{ width: '18rem' }}
                        className="mb-2"
                    >
                        <Card.Body>
                            <Card.Title>Albums</Card.Title>
                            <Card.Text>
                                View and manage your albums
                            </Card.Text>
                            <Button
                                variant="primary"
                                type="button"
                                onClick={this.props.showAlbumsPage}
                            >
                                View/Manage
                            </Button>
                        </Card.Body>
                    </Card>
                    <Card
                        bg="Light"
                        text="dark"
                        style={{ width: '18rem' }}
                        className="mb-2"
                    >
                        <Card.Body>
                            <Card.Title>Photos</Card.Title>
                            <Card.Text>
                                View and manage your photos
                            </Card.Text>
                            <Button
                                variant="primary"
                                type="button"
                                onClick={this.props.showPhotosPage}
                            >
                                View/Manage
                            </Button>
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        )
    }
}

export default HomePage;