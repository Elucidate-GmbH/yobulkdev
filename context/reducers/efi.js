export function setEfiOrigin(state, action) {
  switch (action.type) {
    case 'SET_EFI_ORIGIN':
      return { ...state, efiOrigin: action.payload };
    default:
      return state;
  }
}
