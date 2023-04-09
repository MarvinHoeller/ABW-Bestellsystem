import axios, { AxiosError } from 'axios';
import { useState, useEffect } from 'react';
import {
  Container,
  Form,
  FormControl,
  Nav,
  Navbar,
  NavbarBrand,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import { Link, redirect, useNavigate } from 'react-router-dom';

import './menustyle.css';
import { useAuth } from '../../authentication/authHandler';
import ABWLOGO from '../../cosmectics/abwlogo.png';
import { AdminRequest } from '../requester';

import { BoxArrowRight, Tools, Cart2, PersonFill, VectorPen } from 'react-bootstrap-icons';

interface Probs {
  onSearch?: any;
  needsAdmin?: boolean;
  needsEditor?: boolean;
}

const Menu = (props: Probs) => {
  //Access to the server
  const [isAdmin, setAdmin] = useState<boolean>(
    localStorage.getItem('AdminAccess') === 'true'
  );
  const [isEditor, setEditor] = useState<boolean>(
    localStorage.getItem('EditorAccess') === 'true'
  );

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (props.needsAdmin || props.needsEditor || auth.accessToken.length > 0) {
      getAccess();
    } else {
      setAdmin(false);
    }
  }, []);

  const getAccess = async () => {
    AdminRequest(auth, () => navigate('/')).get({},'access', (data) => {
      setAdmin(!!(data.res.isAdmin || data.res.isEditor));
      setEditor(!!data.res.isEditor)
      localStorage.setItem('AdminAccess', `${!!(data.res.isAdmin)}`);
      localStorage.setItem('EditorAccess', `${!!(data.res.isEditor)}`);
    });
  };

  return (
    <Navbar bg="dark" sticky="top" variant="dark" expand="md">
      <Container>
        <Link className="nav-link" to={'/home'}>
          <NavbarBrand>
            <img
              alt=""
              src={ABWLOGO}
              width="30"
              height="30"
              className="d-inline-block align-top"
            />
            ABW Bestellsystem
          </NavbarBrand>
        </Link>
        {/* get USER-Access NEEDS FIX*/}
        {auth.accessToken.length > 0 ? (
          <>
            <Navbar.Toggle aria-controls="navbarScroll" />
            <Navbar.Collapse
              id="navbarScroll"
              className="col justify-content-around"
            >
              <Nav style={{ maxHeight: '200px' }} navbarScroll>
                <Link className="nav-link" to={'/home'}>
                  {auth.sites?.length === 0 && 'Home'}
                </Link>
                {auth.sites?.length > 0 ? (
                  auth.sites.map((site) => (
                    <OverlayTrigger
                      placement="bottom"
                      key={site?._id}
                      overlay={
                        <Tooltip>Bestellseite "{site?.sitename}"</Tooltip>
                      }
                    >
                      <Link className="nav-link" to={`/home/${site?._id}`}>
                        {' '}
                        {site?.sitename}{' '}
                      </Link>
                    </OverlayTrigger>
                  ))
                ) : (
                  <></>
                )}
              </Nav>

              <Form>
                <FormControl
                  className="d-flex mb-3 mt-3 mb-md-0 mt-md-0 me-2"
                  type="search"
                  placeholder="Suchen"
                  aria-label="Search"
                  onChange={props.onSearch}
                />
              </Form>

              <Nav>
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Profil</Tooltip>}
                >
                  <Link className="nav-link" to={'/profile'}>
                    <PersonFill className="icon" size={18} />
                    <div className="menu-text">Profil</div>
                  </Link>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip>
                      Du hast {auth.user?.order ? auth.user.order.length : '0'}.
                      Artikel im Warenkorb
                    </Tooltip>
                  }
                >
                  <Link className="nav-link" to={'/cart'}>
                    <Cart2 className="icon" size={18} />
                    <span id="cart-overlay">
                      {auth.user?.order ? auth.user.order.length : '0'}
                    </span>
                    <div className="menu-text">Warenkorb</div>
                  </Link>
                </OverlayTrigger>
                {/* check if user is admin */}
                {isAdmin ? (
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>Verwaltung</Tooltip>}
                  >
                    <Link className="nav-link" to={'/admin'}>
                      <Tools className="icon" size={18} />
                      <div className="ms-2 menu-text">Verwaltung</div>
                    </Link>
                  </OverlayTrigger>
                ) : null}
                {/* TODO: check if user is editor */}
                {isEditor ? (
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Editor</Tooltip>}
                >
                  <Link className="nav-link" to={'/editor'}>
                    <VectorPen className="icon" size={18} />
                    <div className="ms-2 menu-text">Editor</div>
                  </Link>
                </OverlayTrigger>
                ) : null}
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Abmelden</Tooltip>}
                >
                  <Link
                    className="nav-link"
                    onClick={() => auth.signout(() => redirect('/'))}
                    to={'/'}
                  >
                    <BoxArrowRight className="icon" size={18} />
                    <div className="ms-2 menu-text">Abmelden</div>
                  </Link>
                </OverlayTrigger>
              </Nav>
            </Navbar.Collapse>
          </>
        ) : (
          <Nav>
            <Link className="nav-link" to={'/'}>
              Login
            </Link>
          </Nav>
        )}
      </Container>
    </Navbar>
  );
};

export default Menu;
