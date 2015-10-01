import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import config from 'client/config/environment';

const {
  Route,
  get,
  set,
  on,
  inject: { service }
} = Ember;

export default Route.extend(ApplicationRouteMixin, {
  currentSession: service(),

  // If you are visiting the site while authenticated, lets grab your data
  beforeModel() {
    const session = get(this, 'currentSession');
    if (get(session, 'isAuthenticated')) {
      return this._getCurrentUser();
    }
  },

  title(tokens) {
    const base = 'Hummingbird';
    const hasTokens = tokens && tokens.length;
    return hasTokens ? `${tokens.reverse().join(' | ')} | ${base}` : base;
  },

  // This method is fired by ESA when authentication is successful
  sessionAuthenticated() {
    this._getCurrentUser();
    this._super(...arguments);
  },

  // By default, ESA reloads the browser to `baseURL`
  // we don't want that, so just redirect to dashboard
  sessionInvalidated() {
    this.transitionTo('dashboard');
  },

  _getCurrentUser() {
    // @Cleanup: This stores an undefined record under users
    return get(this, 'store').findRecord('user', 'me').then((user) => {
      const userId = get(user, 'id');
      set(this, 'currentSession.userId', userId);
    });
  }
});