import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

class AccountPage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            current_email: "",
            email: "",
            is_email_confirmed: false,
            account_type: "",
            twofa_code: "",
            twofa_error: "",
            is_email_valid: true,
            isLoading: false,
            isConfirmingEmail: false,
        }
    }

    componentDidMount() {
        this.getAccountInfo()
    }

    componentWillUnmount() {
        this.resetAccountPage()
    }

    resetAccountPage = () => {
        this.setState({
            email: "",
            is_email_confirmed: false,
            account_type: "",
            twofa_code: "",
            twofa_error: "",
            is_email_valid: true,
            isLoading: false,
            isConfirmingEmail: false,
        })
    }

    handle2FACodeChange = (e) => {
        this.setState({ twofa_code: e.target.value })
    }

    handleEmailChange = (e) => {
        this.setState({ email: e.target.value }, () => {
            if (this.isValidEmail(this.state.email)) {
                this.setState({ is_email_valid: true })
            } else {
                this.setState({ is_email_valid: false })
            }
        })
    }

    isValidEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    send2faCode = async () => {
        this.setState({ isLoading: true }, async () => {
            const token = localStorage.getItem('token');
            await fetch("/api/two_fa/user/" + encodeURIComponent(this.props.appUserID), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }).then(async (resp) => {
                if (resp.status !== 204) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    this.setState({ isConfirmingEmail: true });
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        });
    }

    confirm2faCode = async () => {
        this.setState({ isLoading: true }, async () => {
            const token = localStorage.getItem('token');
            let accountInfo = {
                app_user_id: this.props.appUserID,
                twofa_code: this.state.twofa_code,
            }
            await fetch("/api/two_fa", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(accountInfo)
            }).then(async (resp) => {
                if (resp.status !== 200) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    let respTxt = await resp.text();
                    if (respTxt === "correct") {
                        this.setState({ isConfirmingEmail: false, isLoading: false })
                        this.getAccountInfo()
                    } else {
                        this.setState({ twofa_error: respTxt });
                    }
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        });
    }

    getAccountInfo = async () => {
        const token = localStorage.getItem('token');
        await fetch("/api/account_info/user/" + encodeURIComponent(this.props.appUserID), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        }).then(async (resp) => {
            if (resp.status !== 200) {
                let errorMsg = await resp.text();
                this.props.displayError(errorMsg, true);
            } else {
                let respJSON = await resp.json();
                this.setState({
                    email: respJSON.email,
                    current_email: respJSON.email,
                    is_email_confirmed: respJSON.is_email_confirmed,
                    account_type: respJSON.account_type,
                })
            }
        });
    }

    updateAccountInfo = async () => {
        if (!this.state.email || !this.state.is_email_valid) {
            return
        }
        this.setState({ isLoading: true }, async () => {
            let accountInfo = {
                app_user_id: this.props.appUserID,
                email: this.state.email,
            }
            const token = localStorage.getItem('token');
            await fetch("/api/account_info", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(accountInfo)
            }).then(async (resp) => {
                if (resp.status !== 204) {
                    let errorMsg = await resp.text();
                    this.props.displayError(errorMsg, true);
                } else {
                    this.getAccountInfo()
                }
            }).finally(() => {
                this.setState({ isLoading: false });
            });
        })
    }

    render() {
        return (
            <div className="auth-form-container">
                <div>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email&ensp;</Form.Label>
                            {this.state.is_email_confirmed ? <span class="badge rounded-pill bg-success">Confirmed</span> : <span class="badge rounded-pill bg-danger">Unconmfirmed</span>}
                            <Form.Control
                                type="text"
                                placeholder="Email"
                                onChange={(e) => this.handleEmailChange(e)}
                                value={this.state.email}
                            />
                            {!this.state.is_email_valid ?
                                <Form.Text className="text-muted">
                                    <div className="req-not-met">Invalid Email</div>
                                </Form.Text>
                                :
                                null
                            }
                        </Form.Group>
                        {!this.state.is_email_confirmed ?
                            <span>
                                {this.state.isConfirmingEmail ?
                                    <span>
                                        <Button
                                            variant="primary"
                                            type="button"
                                            disabled={true}
                                        >
                                            Awaiting Confirmation
                                        </Button>
                                        <br />
                                        <br />
                                    </span>
                                    :
                                    !this.state.isLoading && this.state.current_email ?
                                        <span>
                                            <Button
                                                variant="primary"
                                                type="button"
                                                onClick={this.send2faCode}
                                            >
                                                Send Confirmation Email
                                            </Button>
                                            <br />
                                            <br />
                                        </span>
                                        :
                                        null
                                }
                                {this.state.isConfirmingEmail ?
                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                        <Form.Label>2FA Code</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="2FA Code"
                                            onChange={(e) => this.handle2FACodeChange(e)}
                                            value={this.state.twofa_code}
                                        />
                                        <Form.Text className="text-muted">
                                            {this.state.loginError ?
                                                <div className="req-not-met">{this.state.loginError}</div>
                                                : null
                                            }
                                        </Form.Text>
                                        <Form.Text className="text-muted">
                                            <ul className="pass-req-list input-warning">
                                                {this.state.twofa_error ?
                                                    <li className="req-not-met">{this.state.twofa_error}</li>
                                                    :
                                                    null
                                                }
                                            </ul>
                                        </Form.Text>
                                    </Form.Group>
                                    :
                                    null
                                }
                            </span>
                            :
                            null
                        }
                        {this.state.isLoading ?
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            :
                            <span>
                                {this.state.isConfirmingEmail ?
                                    <Button
                                        variant="success"
                                        type="button"
                                        className="float-right"
                                        onClick={this.confirm2faCode}
                                    >
                                        Confirm Code
                                    </Button>
                                    :
                                    <Button
                                        variant="success"
                                        type="button"
                                        className="float-right"
                                        onClick={this.updateAccountInfo}
                                    >
                                        Update
                                    </Button>
                                }
                                <Button
                                    variant="secondary"
                                    type="button"
                                    className="float-left"
                                    onClick={this.props.closeAccountModal}
                                >
                                    Close
                                </Button>
                            </span>
                        }
                    </Form>
                </div>
            </div>
        )
    }
}

export default AccountPage;