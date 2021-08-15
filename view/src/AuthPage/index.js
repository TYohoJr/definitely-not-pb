import { Component, Fragment } from 'react';
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
            isResetPassowrd: false,
            resetPassEmail: "",
            isSettingNewPassword: false,
            twoFACode: "",
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
                    this.props.displayError(errorMsg, true);
                } else {
                    let respJSON = await resp.json();
                    if (respJSON.is_error) {
                        this.setState({ loginError: respJSON.error_message })
                    } else {
                        this.setState({ loginError: "" })
                        this.props.setLoggedIn(respJSON.response)
                    }
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    requestReset = async () => {
        this.setState({ isLoading: true }, async () => {
            let resetData = {
                email: this.state.resetPassEmail,
            }
            await fetch("/api/password_reset", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(resetData)
            }).then(async (resp) => {
                if (resp.status !== 204) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    this.setState({ isSettingNewPassword: true })
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    resetPassword = async () => {
        this.setState({ isLoading: true }, async () => {
            let resetData = {
                email: this.state.resetPassEmail,
                twofa_code: this.state.twoFACode,
                password: this.state.newPassword,
            }
            await fetch("/api/password_reset", {
                method: "PUT",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(resetData)
            }).then(async (resp) => {
                if (resp.status !== 204) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    this.props.displayError("Your password has been successfully changed", false, "Success");
                    this.setState({
                        isSettingNewPassword: false,
                        isResetPassowrd: false,
                    })
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
                this.props.displayError(errorMsg, true);
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

    handleEmailChange = (e) => {
        this.setState({ resetPassEmail: e.target.value })
    }

    handleTwoFACode = (e) => {
        this.setState({ twoFACode: e.target.value })
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
                        this.props.displayError(errorMsg, true);
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
        this.setState({ isLoading: true }, async () => {
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
                    this.props.displayError(errorMsg, true);
                } else {
                    let respJSON = await resp.json();
                    if (respJSON.is_error) {
                        let errorMsg = await resp.text();
                        this.props.displayError(errorMsg, true);
                    } else {
                        this.props.showLoginPage()
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
                {!this.props.isRegistering ?
                    this.state.isResetPassowrd ?
                        this.state.isSettingNewPassword ?
                            <Form>
                                <span className="close-btn-form-container">
                                    <Button // close
                                        type="button"
                                        variant="secondary"
                                        className="float-right"
                                        onClick={this.props.closeAuthPage}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                            <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z" />
                                        </svg>
                                    </Button>
                                </span>
                                <Form.Group className="mb-3" controlId="formReset2FACode">
                                    <Form.Label>2FA Code:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="2FA Code"
                                        required={true}
                                        maxLength={6}
                                        onChange={(e) => this.handleTwoFACode(e)}
                                        value={this.state.twoFACode}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formResetPassword">
                                    <Form.Label>New Password:</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        required={true}
                                        maxLength={50}
                                        onChange={(e) => this.handleNewPasswordChange(e)}
                                        value={this.state.newPassword}
                                    />
                                    <Form.Text className="text-muted">
                                        <ul className="pass-req-list input-warning">
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
                                <Form.Group className="mb-3" controlId="formResetReEnterPassword">
                                    <Form.Label>Re-Enter New Password:</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Re-Enter Password"
                                        required={true}
                                        maxLength={50}
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
                                <Form.Group className="mb-3" controlId="formResetConfirm">
                                    {this.state.isLoading ?
                                        <Spinner className="float-center" animation="border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </Spinner>
                                        :
                                        <Fragment>
                                            <Button
                                                variant="success"
                                                type="submit"
                                                className="float-center mt-3"
                                                onClick={this.resetPassword}
                                            >
                                                Reset Password
                                            </Button>
                                        </Fragment>
                                    }
                                </Form.Group>
                            </Form>
                            :
                            <Form>
                                <span className="close-btn-form-container">
                                    <Button // close
                                        type="button"
                                        variant="secondary"
                                        className="float-right"
                                        onClick={this.props.closeAuthPage}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                            <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z" />
                                        </svg>
                                    </Button>
                                </span>
                                <Form.Group className="mb-3" controlId="formResetEmail">
                                    <Form.Label>Email:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Email"
                                        required={true}
                                        maxLength={50}
                                        onChange={(e) => this.handleEmailChange(e)}
                                        value={this.state.resetPassEmail}
                                    />
                                    {this.state.isLoading ?
                                        <Spinner className="float-center" animation="border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </Spinner>
                                        :
                                        <Fragment>
                                            <Button
                                                variant="success"
                                                type="submit"
                                                className="float-center mt-3"
                                                onClick={this.requestReset}
                                            >
                                                Request Reset
                                            </Button>
                                        </Fragment>
                                    }
                                </Form.Group>
                            </Form>
                        :
                        <div>
                            <Form>
                                <span className="close-btn-form-container">
                                    <Button // close
                                        type="button"
                                        variant="secondary"
                                        className="float-right"
                                        onClick={this.props.closeAuthPage}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                            <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z" />
                                        </svg>
                                    </Button>
                                </span>
                                <Form.Group className="mb-3" controlId="formLoginUsername">
                                    <Form.Label>Username:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Username"
                                        required={true}
                                        maxLength={50}
                                        onChange={(e) => this.handleUsernameChange(e)}
                                        value={this.state.username}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password:</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        required={true}
                                        maxLength={50}
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
                                    <Spinner className="float-center" animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                    :
                                    <Fragment>
                                        <Button
                                            variant="success"
                                            type="submit"
                                            className="float-center"
                                            onClick={() => this.logIn(this.state.username, this.state.password)}
                                        >
                                            Login
                                        </Button>
                                        <div className="reset-pass-container">
                                            <a
                                                href="/#"
                                                onClick={() => this.setState({ isResetPassowrd: true })}
                                            >Forgot Password</a>
                                        </div>
                                    </Fragment>
                                }
                            </Form>
                        </div>
                    :
                    <div>
                        <Form>
                            <span className="close-btn-form-container">
                                <Button // close
                                    type="button"
                                    variant="secondary"
                                    className="float-right"
                                    onClick={this.props.closeAuthPage}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                        <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z" />
                                    </svg>
                                </Button>
                            </span>
                            <Form.Group className="mb-3" controlId="formRegisterBasicUsername">
                                <Form.Label>Username:</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Username"
                                    required={true}
                                    maxLength={50}
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
                                <Form.Label>Password:</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Password"
                                    required={true}
                                    maxLength={50}
                                    onChange={(e) => this.handleNewPasswordChange(e)}
                                    value={this.state.newPassword}
                                />
                                <Form.Text className="text-muted">
                                    <ul className="pass-req-list input-warning">
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
                            <Form.Group className="mb-3" controlId="formBasicPasswordReEnter">
                                <Form.Label>Re-Enter Password:</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Re-Enter Password"
                                    required={true}
                                    maxLength={50}
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
                                <Form.Label>Secret Question:</Form.Label>
                                <Form.Control
                                    onChange={this.handleSecretQuestionChange}
                                    required={true}
                                    as="select"
                                >
                                    <option disabled selected value="">Select Question</option>
                                    {this.state.secretQuestions.map((quest, i) => {
                                        return <option value={i}>{quest.question}</option>
                                    })}
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicQuestionAnswer">
                                <Form.Label>Secret Question Answer:</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder=""
                                    required={true}
                                    maxLength={50}
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
                                <Spinner className="float-center" animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                :
                                <Fragment>
                                    <Button
                                        variant="success"
                                        type="submit"
                                        className="float-center"
                                        onClick={this.registerUser}
                                    >
                                        Register
                                    </Button>
                                </Fragment>
                            }
                        </Form>
                    </div>
                }
            </div>
        )
    }
}

export default AuthPage;