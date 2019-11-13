import getValue from './getValue';
const createOnChange =
  (name, change) =>
    event => change(name, getValue(event));
export default createOnChange;
