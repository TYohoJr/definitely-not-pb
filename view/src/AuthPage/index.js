import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import './index.css';

class AuthPage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            username: "",
            password: "",
            newUsername: "",
            newPassword: "",
            newPasswordReEnter: "",
            isRegistering: false,
            isLowercasePassword: false,
            isUppercasePassword: false,
            isNumberPassword: false,
            passwordsMatch: false,
            isValidUsername: true,
            secretQuestions: [],
            secretQuestionPickID: null,
            secretQuestionPickText: "Select Question",
            secretQuestionAnswer: "",
            loginError: "",
            isLoading: false,
        }
    }

    componentDidMount() {
        this.getSecretQuestions()
    }

    componentWillUnmount() {
        this.resetAuthPage()
    }

    resetAuthPage = () => {
        this.setState({
            username: "",
            password: "",
            newUsername: "",
            newPassword: "",
            newPasswordReEnter: "",
            isRegistering: false,
            isLowercasePassword: false,
            isUppercasePassword: false,
            isNumberPassword: false,
            passwordsMatch: false,
            isValidUsername: true,
            secretQuestionPickID: null,
            secretQuestionPickText: "Select Question",
            secretQuestionAnswer: "",
            loginError: "",
            isLoading: false,
        })
    }

    logIn = async (username, password) => {
        this.setState({ isLoading: true }, async () => {
            let loginData = {
                username: username,
                password: password,
            }
            await fetch("/api/login", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(loginData)
            }).then(async (resp) => {
                if (resp.status !== 200) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg);
                } else {
                    let respJSON = await resp.json();
                    if (respJSON.is_error) {
                        this.setState({ loginError: respJSON.error_message })
                    } else {
                        this.setState({ loginError: "" })
                        this.props.setLoggedIn(respJSON.app_user_id)
                    }
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    getSecretQuestions = async () => {
        await fetch("/api/secret_question", {
            method: "GET",
            headers: {
                "content-type": "application/json",
            }
        }).then(async (resp) => {
            if (resp.status !== 200) {
                let errorMsg = await resp.text();
                this.props.displayError(errorMsg);
            } else {
                let respJSON = await resp.json();
                this.setState({ secretQuestions: respJSON })
            }
        })
    }

    handleSecretQuestionChange = (e) => {
        let questID = this.state.secretQuestions[e.target.value].id
        let questText = this.state.secretQuestions[e.target.value].question
        this.setState({ secretQuestionPickID: questID, secretQuestionPickText: questText })
    }

    handleSecretQuestionAnswerChange = (e) => {
        this.setState({ secretQuestionAnswer: e.target.value })
    }

    handleUsernameChange = (e) => {
        this.setState({ username: e.target.value })
    }

    handlePasswordChange = (e) => {
        this.setState({ password: e.target.value })
    }

    handleNewUsernameChange = async (e) => {
        this.setState({ newUsername: e.target.value }, async () => {
            if (this.state.newUsername) {
                await fetch("/api/user/" + encodeURIComponent(this.state.newUsername), {
                    method: "GET",
                    headers: {
                        "content-type": "application/json",
                    }
                }).then(async (resp) => {
                    if (resp.status !== 200) {
                        let errorMsg = await resp.text();
                        this.props.displayError(errorMsg);
                    } else {
                        let respJSON = await resp.json();
                        if (respJSON.length > 0) {
                            this.setState({ isValidUsername: false })
                        } else {
                            this.setState({ isValidUsername: true })
                        }
                    }
                })
            } else {
                this.setState({ isValidUsername: true })
            }

        })
    }

    handleNewPasswordChange = (e) => {
        this.setState({ newPassword: e.target.value }, () => {
            // Lowercase check
            if (this.state.newPassword.toLowerCase() === this.state.newPassword) {
                this.setState({ isLowercasePassword: false })
            } else {
                this.setState({ isLowercasePassword: true })
            }
            // Uppercase check
            if (this.state.newPassword.toUpperCase() === this.state.newPassword) {
                this.setState({ isUppercasePassword: false })
            } else {
                this.setState({ isUppercasePassword: true })
            }
            // Number check
            if (!/\d/.test(this.state.newPassword)) {
                this.setState({ isNumberPassword: false })
            } else {
                this.setState({ isNumberPassword: true })
            }
        })
    }

    handleNewPasswordReEnterChange = (e) => {
        this.setState({ newPasswordReEnter: e.target.value }, () => {
            if (this.state.newPassword === this.state.newPasswordReEnter) {
                this.setState({ passwordsMatch: true })
            } else {
                this.setState({ passwordsMatch: false })
            }
        })
    }

    registerUser = async () => {
        if (!this.state.isLowercasePassword || !this.state.isUppercasePassword || !this.state.isNumberPassword || !this.state.passwordsMatch || !this.state.isValidUsername || !this.state.newUsername || !this.state.secretQuestionPickID || !this.state.secretQuestionAnswer) {
            return
        }
        this.setState({isLoading: true}, async () => {
            let userData = {
                username: this.state.newUsername,
                password: this.state.newPassword,
                secret_question_id: this.state.secretQuestionPickID,
                secret_question_answer: this.state.secretQuestionAnswer,
            }
            await fetch("/api/user", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(userData)
            }).then(async (resp) => {
                if (resp.status !== 201) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg);
                } else {
                    let respJSON = await resp.json();
                    if (respJSON.is_error) {
                        console.error(respJSON.error_message)
                    } else {
                        this.resetAuthPage()
                    }
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    render() {
        return (
            <div className="auth-form-container">
                {!this.state.isRegistering ?
                    <div>
                        <Form>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Username"
                                    onChange={(e) => this.handleUsernameChange(e)}
                                    value={this.state.username}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Password"
                                    onChange={(e) => this.handlePasswordChange(e)}
                                    value={this.state.password}
                                />
                                <Form.Text className="text-muted">
                                    {this.state.loginError ?
                                        <div className="req-not-met">{this.state.loginError}</div>
                                        : null
                                    }
                                </Form.Text>
                            </Form.Group>
                            {this.state.isLoading ?
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                :
                                <span>
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => this.setState({ isRegistering: true })}
                                    >
                                        Register
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="button"
                                        onClick={() => this.logIn(this.state.username, this.state.password)}
                                    >
                                        Submit
                                    </Button>
                                </span>
                            }
                        </Form>
                    </div>
                    :
                    <div>
                        <Form>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Username"
                                    onChange={(e) => this.handleNewUsernameChange(e)}
                                    value={this.state.newUsername}
                                />
                                <Form.Text className="text-muted">
                                    {!this.state.isValidUsername ?
                                        <div className="req-not-met">Username already taken</div>
                                        : null
                                    }
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Password"
                                    onChange={(e) => this.handleNewPasswordChange(e)}
                                    value={this.state.newPassword}
                                />
                                <Form.Text className="text-muted">
                                    <ul className="pass-req-list">
                                        {this.state.isLowercasePassword ?
                                            <li className="req-met">Must contain a lowercase letter</li>
                                            :
                                            <li className="req-not-met">Must contain a lowercase letter</li>
                                        }
                                        {this.state.isUppercasePassword ?
                                            <li className="req-met">Must contain an uppercase letter</li>
                                            :
                                            <li className="req-not-met">Must contain an uppercase letter</li>
                                        }
                                        {this.state.isNumberPassword ?
                                            <li className="req-met">Must contain a number</li>
                                            :
                                            <li className="req-not-met">Must contain a number</li>
                                        }
                                    </ul>
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Re-Enter Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Re-Enter Password"
                                    onChange={(e) => this.handleNewPasswordReEnterChange(e)}
                                    value={this.state.newPasswordReEnter}
                                />
                                <Form.Text className="text-muted">
                                    {!this.state.passwordsMatch && this.state.newPassword ?
                                        <div className="req-not-met">Passwords must match</div>
                                        : null
                                    }
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicQuestion">
                                <Form.Label>Secret Question</Form.Label>
                                <Form.Control
                                    onChange={this.handleSecretQuestionChange}
                                    as="select"
                                >
                                    <option disabled selected value="">Select Question</option>
                                    {this.state.secretQuestions.map((quest, i) => {
                                        return <option value={i}>{quest.question}</option>
                                    })}
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicQuestionAnswer">
                                <Form.Label>Secret Question Answer</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder=""
                                    onChange={(e) => this.handleSecretQuestionAnswerChange(e)}
                                />
                                <Form.Text className="text-muted">
                                    {!this.state.secretQuestionAnswer ?
                                        <div className="req-not-met">Answer required</div>
                                        : null
                                    }
                                </Form.Text>
                            </Form.Group>
                            {this.state.isLoading ?
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                :
                                <span>
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={this.resetAuthPage}
                                    >
                                        Return To Login
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="button"
                                        onClick={this.registerUser}
                                    >
                                        Register
                                    </Button>
                                </span>
                            }
                        </Form>
                    </div>
                }
            </div>
        )
    }
}

export default AuthPage;