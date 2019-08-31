import SourceCodeAppLinkedState from '../state/SourceCodeAppLinkedState';
import uuidv4 from 'uuidv4';

const createSourceCodeAppLinkedState = () => {
  return new SourceCodeAppLinkedState(uuidv4());
};

export default createSourceCodeAppLinkedState;