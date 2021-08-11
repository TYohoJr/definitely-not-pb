import { Component } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import './index.css';

class HomePage extends Component {
    constructor() {
        super()
        this.state = {
            accountTypes: [
                {
                    type: "Test",
                    howTo: "Register for an account",
                    features: [
                        "Limited site access",
                        "Ability to create albums using a preset of images",
                        "Unable to Upload/Download images",
                    ]
                },
                {
                    type: "Free",
                    howTo: "Confirm your email",
                    features: [
                        "Full site access",
                        "Upload up to 1GB of images per month",
                        "Download up to 1GB of images per month"
                    ]
                },
                {
                    type: "Premium",
                    howTo: "Contact me",
                    features: [
                        "Full site access",
                        "Upload up to 15GB of images per month",
                        "Download up to 15GB of images per month"
                    ]
                }
            ]
        }
    }

    render() {
        return (
            <div>
                <h3 className="title-header">Welcome to Definitely Not PB!</h3>
                <p><small>*For legal reasons let's say it stands for Peanut Butter :)</small></p>
                <br />
                <h5>Features:</h5>
                <ul className="no-bullets">
                    <li className="mb-2">Upload photos and create albums out of them</li>
                    <li className="mb-2">View the albums in a fullscreen slideshow</li>
                    <li className="mb-2">When you delete something it's actually deleted, no secret storing of your data</li>
                    <li className="mb-2">Optimized for mobile viewing</li>
                    <li className="mb-2">Completely free at all account types (and no ads)</li>
                    <li className="mb-2">Now with Dark Mode!</li>
                </ul>
                <br />
                <br />
                <h4>Account Types</h4>
                <Row
                    xs={1}
                    md={3}
                    className="types-list-container"
                >
                    {this.state.accountTypes.map((typeDetails, idx) => (
                        <Col>
                            <Card
                                bg="light"
                                key={idx}
                                text="dark"
                            >
                                <Card.Header>
                                    <Card.Title>{typeDetails.type}</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Text>
                                        <ul className="no-bullets">
                                            {typeDetails.features.map((feature, i) => {
                                                return <li key={i} className="mb-2">{feature}</li>
                                            })}
                                        </ul>
                                    </Card.Text>
                                </Card.Body>
                                <Card.Footer>
                                    <small className="text-muted">How to obtain: {typeDetails.howTo}</small>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        )
    }
}

export default HomePage;