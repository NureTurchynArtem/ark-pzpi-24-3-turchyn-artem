import { Transform } from 'class-transformer';

/** Перетворює рядки 'true' / 'false' з параметрів запиту на логічні значення */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    return value === 'false' ? false : value;
  });
}
