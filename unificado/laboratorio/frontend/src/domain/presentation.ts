/** Display decimal commas while retaining the API's canonical decimal strings. */
export const decimalText = (value:string|number):string => String(value).replace('.',',');
export const decimalValue = (value:string):string => value.replace(',','.');
