import { Container } from 'react-bootstrap';
import Menu from './menu/Menu';

const NotFoundTag = (props: any) => {
  return (
    <>
      <Menu />
      <Container className="content">
        <h1>URL not Found </h1>
      </Container>
    </>
  );
};

export default NotFoundTag;
