import Route from 'ember-route';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import { bind } from 'ember-runloop';
import { isEmpty, typeOf } from 'ember-utils';
import { isEmberArray } from 'ember-array/utils';
import { task, timeout } from 'ember-concurrency';
import jQuery from 'jquery';
import QueryableMixin from 'client/mixins/routes/queryable';
import PaginationMixin from 'client/mixins/routes/pagination';
import SlideHeaderMixin from 'client/mixins/routes/slide-header';

export default Route.extend(SlideHeaderMixin, QueryableMixin, PaginationMixin, {
  mediaQueryParams: {
    averageRating: { refreshModel: true, replace: true },
    genres: { refreshModel: true, replace: true },
    text: { refreshModel: true, replace: true },
    year: { refreshModel: true, replace: true }
  },
  templateName: 'media/index',

  refreshDebounced: task(function* () {
    yield timeout(1000);
    this.refresh();
  }).restartable(),

  init() {
    this._super(...arguments);
    const mediaQueryParams = get(this, 'mediaQueryParams');
    const queryParams = get(this, 'queryParams') || {};
    set(this, 'queryParams', Object.assign(mediaQueryParams, queryParams));
  },

  beforeModel() {
    this._super(...arguments);
    const controller = this.controllerFor(get(this, 'routeName'));
    if (get(controller, 'availableGenres') !== undefined) {
      return;
    }
    get(this, 'store').query('genre', {
      page: { limit: 10000, offset: 0 }
    }).then(genres => set(controller, 'availableGenres', genres));
  },

  model(params) {
    const hash = { page: { offset: 0, limit: 20 } };
    const filters = this._buildFilters(params);
    const options = Object.assign(filters, hash);
    const [mediaType] = get(this, 'routeName').split('.');
    return get(this, 'store').query(mediaType, options);
  },

  setupController(controller) {
    this._super(...arguments);
    jQuery(document.body).addClass('browse-page');
    const binding = bind(controller, '_handleScroll');
    set(this, 'scrollBinding', binding);
    jQuery(document).on('scroll', binding);
  },

  resetController() {
    this._super(...arguments);
    jQuery(document.body).removeClass('browse-page');
    jQuery(document).off('scroll', get(this, 'scrollBinding'));
  },

  _buildFilters(params) {
    const filters = { filter: {} };
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (isEmpty(value) === true) {
        return;
      } else if (isEmberArray(value) === true) {
        const filtered = value.reject(x => isEmpty(x));
        if (isEmpty(filtered) === true) {
          return;
        }
      }
      const type = typeOf(value);
      filters.filter[key] = this.serializeQueryParam(value, key, type);
    });

    if (filters.filter.text === undefined) {
      filters.sort = '-user_count';
    }
    return filters;
  },

  actions: {
    refresh() {
      this.refresh();
    }
  }
});
