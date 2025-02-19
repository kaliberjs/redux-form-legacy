import {initialState} from './reducer';
import deepEqual from 'deep-equal';
import getValues from './getValues';
import isValid from './isValid';
import readFields from './readFields';
import handleSubmit from './handleSubmit';
import asyncValidation from './asyncValidation';
import silenceEvents from './events/silenceEvents';
import silenceEvent from './events/silenceEvent';
import createInitialState from './createInitialState';

export default class Form extends Component {

  static defaultProps = {
    asyncBlurFields: [],
    form: initialState,
    readonly: false,
    returnRejectedSubmitPromise: false,
    validate: () => ({})
  }

  constructor(props) {
    super(props);
    const { initialValues, fields } = this.props;
    // Check if form state was initialized, if not, initialize it.
    const form = deepEqual(props.form, initialState) ?
      createInitialState(initialValues, fields, {}, true, false) :
      props.form;

    this.fields = readFields({ ...props, form }, {}, {}, this.asyncValidate);
  }

  componentDidMount() {
    const {fields, form, initialize, initialValues} = this.props;
    if (initialValues && !form._initialized) {
      initialize(initialValues, fields);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!deepEqual(this.props.fields, nextProps.fields) || !deepEqual(this.props.form, nextProps.form, {strict: true})) {
      this.fields = readFields(nextProps, this.props, this.fields, this.asyncValidate);
    }
    if (!deepEqual(this.props.initialValues, nextProps.initialValues)) {
      this.props.initialize(nextProps.initialValues,
        nextProps.fields,
        /* overwriteOnInitialValuesChange */ true);
    }
  }

  componentWillUnmount() {
    this.props.destroy();
  }

  asyncValidate = (name, value) => {
    const {alwaysAsyncValidate, asyncValidate, dispatch, fields, form, startAsyncValidation, stopAsyncValidation, validate} = this.props;
    const isSubmitting = !name;
    if (asyncValidate) {
      const values = getValues(fields, form);
      if (name) {
        values[name] = value;
      }
      const syncErrors = validate(values, this.props);
      const {allPristine} = this.fields._meta;
      const initialized = form._initialized;

      // if blur validating, only run async validate if sync validation passes
      // and submitting (not blur validation) or form is dirty or form was never initialized
      // unless alwaysAsyncValidate is true
      const syncValidationPasses = isSubmitting || isValid(syncErrors[name]);
      if (alwaysAsyncValidate || (syncValidationPasses && (isSubmitting || !allPristine || !initialized))) {
        return asyncValidation(() =>
          asyncValidate(values, dispatch, this.props), startAsyncValidation, stopAsyncValidation, name);
      }
    }
  }

  handleSubmit = (submitOrEvent) => {
    const {onSubmit, fields, form} = this.props;
    const check = submit => {
      if (!submit || typeof submit !== 'function') {
        throw new Error('You must either pass handleSubmit() an onSubmit function or pass onSubmit as a prop');
      }
      return submit;
    };
    return !submitOrEvent || silenceEvent(submitOrEvent) ?
      // submitOrEvent is an event: fire submit
      handleSubmit(check(onSubmit), getValues(fields, form), this.props, this.asyncValidate) :
      // submitOrEvent is the submit function: return deferred submit thunk
      silenceEvents(() =>
        handleSubmit(check(submitOrEvent), getValues(fields, form), this.props, this.asyncValidate));
  }

  render() {
    const allFields = this.fields;
    const {addArrayValue, asyncBlurFields, autofill, blur, change, destroy, focus, fields, form, initialValues, initialize,
      onSubmit, propNamespace, reset, removeArrayValue, returnRejectedSubmitPromise, startAsyncValidation,
      startSubmit, stopAsyncValidation, stopSubmit, submitFailed, swapArrayValues, touch, untouch, validate,
      formKey,
      WrappedComponent,
      ...passableProps} = this.props; // eslint-disable-line no-redeclare
    const {allPristine, allValid, errors, formError, values} = allFields._meta;

    const props = {
      // State:
      active: form._active,
      asyncValidating: form._asyncValidating,
      dirty: !allPristine,
      error: formError,
      errors,
      fields: allFields,
      formKey,
      invalid: !allValid,
      pristine: allPristine,
      submitting: form._submitting,
      submitFailed: form._submitFailed,
      valid: allValid,
      values,

      // Actions:
      asyncValidate: silenceEvents(() => this.asyncValidate()),
      // ^ doesn't just pass this.asyncValidate to disallow values passing
      destroyForm: silenceEvents(destroy),
      handleSubmit: this.handleSubmit,
      initializeForm: silenceEvents(initValues => initialize(initValues, fields)),
      resetForm: silenceEvents(reset),
      touch: silenceEvents((...touchFields) => touch(...touchFields)),
      touchAll: silenceEvents(() => touch(...fields)),
      untouch: silenceEvents((...untouchFields) => untouch(...untouchFields)),
      untouchAll: silenceEvents(() => untouch(...fields))
    };
    const passedProps = propNamespace ? {[propNamespace]: props} : props;
    return <WrappedComponent {...{ ...passableProps, ...passedProps }}/>;
  }
}
