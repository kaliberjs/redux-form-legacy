import getValue from './getValue';
const createOnBlur =
  (name, blur, afterBlur) =>
    event => {
      const value = getValue(event);
      blur(name, value);
      if (afterBlur) {
        afterBlur(name, value);
      }
    };
export default createOnBlur;
