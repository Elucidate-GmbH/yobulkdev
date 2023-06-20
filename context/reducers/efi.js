export function setEfiOrigin(state, action) {
  switch (action.type) {
    case 'SET_EFI_DATA':
      return { ...state, efiOrigin: action.payload.origin };
    default:
      return state;
  }
}
