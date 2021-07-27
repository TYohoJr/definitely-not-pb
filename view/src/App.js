import { Component } from 'react';
import AuthPage from './AuthPage'
import HomePage from './HomePage';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {
  constructor() {
    super()
    this.state = {
      isLoggedIn: false,
    }
  }


  setLoggedIn = async () => {
    this.setState({ isLoggedIn: true })
  }

  render() {
    return (
      <div className="App">
        {this.state.isLoggedIn ?
          <HomePage />
          :
          <AuthPage
            isLoggedIn={this.state.isLoggedIn}
            setLoggedIn={this.setLoggedIn}
          />
        }
      </div>
    );
  }
}

export default App;
