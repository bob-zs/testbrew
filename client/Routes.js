import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter, Route, Switch } from 'react-router-dom';
import { Login, Signup } from './components/AuthForm';
import Home from './components/Home';

import { me } from './store';
import DeprecatedPaginatedTests from './components/DeprecatedPaginatedTests';
import TestGen from './components/Tests/TestGen';
// import PaginatedTests from './components/Tests';

/**
 * COMPONENT
 */
class Routes extends Component {
  componentDidMount() {
    this.props.loadInitialData();
  }

  render() {
    const { isLoggedIn } = this.props;

    return (
      <div>
        {isLoggedIn ? (
          <Switch>
            <Route path='/' exact component={Home} />
            <Route path='/jest' exact component={DeprecatedPaginatedTests} />
            {/* TODO: change this to a better route name */}
            <Route path='/dynamic/:id' exact component={TestGen} />
            <Route path='/dynamic/:promptIndex' component={TestGen} />
          </Switch>
        ) : (
          <Switch>
            <Route path='/' exact component={Home} />
            <Route path='/login' component={Login} />
            <Route path='/signup' component={Signup} />
            <Route path='/jest' exact component={DeprecatedPaginatedTests} />
          </Switch>
        )}
      </div>
    );
  }
}

/**
 * CONTAINER
 */
const mapState = (state) => {
  return {
    // Being 'logged in' for our purposes will be defined has having a state.auth that has a truthy id.
    // Otherwise, state.auth will be an empty object, and state.auth.id will be falsey
    isLoggedIn: !!state.auth.id,
  };
};

const mapDispatch = (dispatch) => {
  return {
    loadInitialData() {
      dispatch(me());
    },
  };
};

// The `withRouter` wrapper makes sure that updates are not blocked
// when the url changes
export default withRouter(connect(mapState, mapDispatch)(Routes));
