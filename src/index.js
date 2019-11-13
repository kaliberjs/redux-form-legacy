import createHigherOrderComponent from './createHigherOrderComponent';
import mapValues from './mapValues';
import * as importedActions from './actions';
import reducer from './reducer'

/**
 * The decorator that is the main API to redux-form
 */
export function reduxForm(config) {

  return WrappedComponent => {

    const ReduxForm = createHigherOrderComponent(WrappedComponent);

    return function ConnectedForm(props) {
      const propsWithConfig = { ...config, ...props }
      const { form: formName, formKey } = propsWithConfig

      const [stateToProps, extra] = formKey !== undefined && formKey !== null
        ? [
          state => ({ form: state && state[formName] && state[formName][formKey] }),
          { form: formName, key: formKey }
        ]
        : [
          state => ({ form: state && state[formName] }),
          { form: formName }
        ]

      const [state, dispatch] = React.useReducer(reducer, {})
      const propsThatDispatch = mapValues(importedActions, x => (...args) => dispatch({ ...x(...args), ...extra }))

      // remove some redux-form config-only props
      const { form, ...passableProps } = propsWithConfig;
      return <ReduxForm {...passableProps} {...stateToProps(state)} {...propsThatDispatch} />;
    }
  }
}
