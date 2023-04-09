import { useState } from 'react';
import {
  Container,
  Dropdown
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../authentication/authHandler';
import { AddSite } from './SitePopUp/sitePopUp';

function Menu() {
  const [show, setShow] = useState(false);

  const auth = useAuth();

  return (
    <>
      <AddSite show={show} onHide={() => setShow(false)} />
      <Dropdown className='d-inline-block'>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
          Bestellseiten ({auth.sites.length})
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {auth.sites.map((site: any) => (
            <Dropdown.Item
              as={Link}
              key={site._id}
              to={`/edit/${site._id}`}
            >
              {site.sitename}
            </Dropdown.Item>
          ))}
          <Dropdown.Item disabled key="placeholder">
            -----------------
          </Dropdown.Item>
          <Dropdown.Item key="createSite" onClick={() => setShow(true)}>
            Seite erstellen
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

    </>
  );
}

export default Menu;
