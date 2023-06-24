export function setEfiData(state, action) {
  switch (action.type) {
    case 'SET_EFI_DATA':
      return { ...state, efiData: { origin: action.payload.origin, documentKey: action.payload.documentKey } };
    default:
      return state;
  }
}
