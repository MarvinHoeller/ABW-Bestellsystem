import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Container, Row
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../authentication/authHandler';
import placeholder from '../../../cosmectics/placeholder.svg';
import Footer from '../../../modules/footer/Footer';
import infoPopup from '../../../modules/infoPopup';
import Menu from '../../../modules/menu/Menu';
import { MenuRequest } from '../../../modules/requester';
import { formatToCurrent, siteIDTranslator } from '../../../modules/Tools';
import './customPage.css';
import { CustomPageSettings } from './customPageModules/customPageSettings';
import { AddIngredient, UpsertItemItem } from './customPageModules/SettingModals';
import { IMenuItem, IMenuSchema } from 'schemas/Schemas';

function CustomPage() {
  const [menu, setMenu] = useState([]);

  const [modalAddItemShow, toggleAddItemShow] = useState(false);
  const [modalAddIngredientShow, toggleAddIngredientShow] = useState(false);
  const [menuItem, setMenuItem] = useState<IMenuItem>();
  const [access, setAccess] = useState<boolean>();
  const { siteID } = useParams();

  let navigate = useNavigate();
  let auth = useAuth();

  useEffect(() => {
    getMenu();
  }, []);

  const getMenu = async () => {
    MenuRequest(auth, () => navigate('/')).get({}, '', (data) => {
      setMenu(data.res);
      setAccess(data.access);
    });
  };

  const upsertMenuItem = async (event: React.FormEvent<HTMLFormElement>, menuID?: string) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    if (menuID) {
      formData.append('menuID', menuID);
    }

    toggleAddItemShow(false);

    MenuRequest(auth, () => navigate('/'), siteID).put(
      formData,
      'item',
      (data) => {
        infoPopup.success('Menüitem hinzugefügt/geändert', 'Erfolgreich!');
        getMenu();
      }
    );
  };

  const removeMenuItem = async (menuID: string) => {
    MenuRequest(auth, () => navigate('/'), siteID).erase(
      { menuID: menuID },
      'item',
      (data) => {
        infoPopup.success('Menüitem entfernt', 'Erfolgreich!');
        getMenu();
      }
    );
  };

  const editMenuItem = async (menu: IMenuSchema) => {
    setMenuItem({
      _id: menu._id,
      name: menu.name,
      price: menu.price,
      infotext: menu.infotext,
      image: new Blob([Buffer.from(menu.image.data)]),
    });
    toggleAddItemShow(true);
  }

  const addMenuIngredient = async (event: any) => {
    event.preventDefault();
    toggleAddIngredientShow(false);

    const formData = new FormData(event.currentTarget);
    const ingredientForm = {
      name: formData.get('name') as string,
      price: formData.get('price') as string,
    };

    toggleAddItemShow(false);
    MenuRequest(auth, () => navigate('/'), siteID).post(
      ingredientForm,
      'ingredient',
      (data) => {
        infoPopup.success('Zusatz hinzugefügt', 'Erfolgreich!');
      }
    );
  };

  const handleChange = (event: any) => {
    if (event.target.name === '') return;

    if (event.target.name === 'image') {
      setMenuItem((prevState) => {
        if (prevState)
          return {
            ...prevState,
            ...{ [event.target.name]: event.target.files[0] },
          };
        else return {
          name: '',
          price: 0,
          infotext: '',
          image: event.target.files[0]
        }
      });
    } else {
      setMenuItem((prevState) => {
        if (prevState)
          return {
            ...prevState,
            ...{ [event.target.name]: event.target.value },
          };
        else return {
          name: '',
          price: 0,
          infotext: '',
          image: new Blob(),
          ...{ [event.target.name]: event.target.value}
        }
      });
    }
  };

  const generateMenuItems = (menu: IMenuSchema) => {
    var b64 = Buffer.from(menu.image.data).toString('base64');

    return (
      <Card style={{ width: '18rem' }} key={menu._id}>
        <Card.Img
          variant="top"
          src={b64 ? `data:image/png;base64,${b64}` : placeholder}
        />
        <Card.Body>
          <Card.Title>{menu.name}</Card.Title>
          <Card.Text>
            {menu.infotext}
            <span>Preis pro Produkt: {formatToCurrent(menu.price)}</span>
          </Card.Text>
          <Col>
            <Button variant="danger" onClick={() => removeMenuItem(menu._id)}>
              Löschen
            </Button>
            <Button className='mt-2' variant="info" onClick={() => editMenuItem(menu)}>
              Überarbeiten
            </Button>
          </Col>
        </Card.Body>
      </Card>
    );
  };

  if (access === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Menu />
      <UpsertItemItem
        onSubmit={upsertMenuItem}
        show={modalAddItemShow}
        onChange={handleChange}
        menuitem={menuItem}
        onHide={() => { toggleAddItemShow(false), setMenuItem(undefined) }}
      />

      <AddIngredient
        onSubmit={addMenuIngredient}
        show={modalAddIngredientShow}
        onChange={handleChange}
        menuitem={menuItem}
        onHide={() => toggleAddIngredientShow(false)}
      />

      <Container className="content dashboard">
        <Row>
          <Col>
            <h2 className='mb-4'>Du editierst "{siteIDTranslator(siteID, auth.sites)}"</h2>
          </Col>
        </Row>

        <Row className="justify-content-evenly">
          {menu
            .filter((element: IMenuSchema) => element.siteID === siteID)
            .map((menuitems: any) => {
              return generateMenuItems(menuitems);
            })}
        </Row>

        <CustomPageSettings
          toggleIngredient={() => toggleAddIngredientShow(true)}
          toggleMenuItem={() => toggleAddItemShow(true)}
        />
      </Container>
      <Footer />
    </>
  );
}

export default CustomPage;
