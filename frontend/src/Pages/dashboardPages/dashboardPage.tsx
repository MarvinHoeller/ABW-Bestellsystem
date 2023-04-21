import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Container,
  Fade,
  Row
} from 'react-bootstrap';

import { Buffer } from 'buffer';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IMenuSchema,
  IOrderPopupData,
  NestedMenuAdditions,
} from '../../../schemas/Schemas';
import placeholder from '../../cosmectics/placeholder.svg';
import { formatToCurrent } from '../../modules/Tools';
import Footer from '../../modules/footer/Footer';
import Menu from '../../modules/menu/Menu';

import { useAuth } from '../../authentication/authHandler';
import infoPopup from '../../modules/infoPopup';
import {
  CustomPageRequest,
  MenuRequest,
  UserRequest,
} from '../../modules/requester';
import './dashboardPage.css';
import { OrderPopup } from './modules/OrderPopup';

function DashboardPage() {
  const [menu, setMenu] = useState<IMenuSchema[]>([]);
  const [menuAdditions, setMenuAdditions] = useState<NestedMenuAdditions[]>([]);
  const [modalShow, setModalShow] = useState(false);
  const [access, setAccess] = useState<boolean>();
  const [popUpData, setPopUpData] = useState<IOrderPopupData>({
    name: '',
    price: 0,
    quantity: 0,
    comment: [],
  });
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { siteID } = useParams();
  const auth = useAuth();

  useEffect(() => {
    if (auth.sites && auth.sites.length > 0) {
      getMenu();
      getMenuAdditions();
      getNotifications();
    }
  }, [auth.sites]);

  // If access denied, redirect to login page via success variable from backend
  useEffect(() => {
    if (access === false) {
      navigate('/');
    }
  }, [access]);

  const getNotifications = async () => {};

  const sendOrder = async (order: any) => {
    UserRequest(auth, () => navigate('/'), siteID ?? auth.sites[0]?._id).post(
      { order: order },
      'orderlist',
      (data: any) => {
        infoPopup.success(
          `Deine Bestellung wurde dem Warenkorb hinzugefügt!`,
          'Bestellung erfolgreich'
        );
        auth.updateUserOrder();
      }
    );
  };

  const getMenu = async () => {
    MenuRequest(auth, () => navigate('/')).get({},'', (data: any) => {
      setMenu(data.res);
      setAccess(data.access);
    });
  };

  const getMenuAdditions = async () => {
    CustomPageRequest(auth, () => navigate('/')).get({},
      'menuAddions',
      (data: any) => {
        setMenuAdditions(data.res);
      }
    );
  };

  const generateItems = (item: IOrderPopupData) => {
    const b64 =
      item.image?.data.length === 0
        ? undefined
        : //@ts-ignore
          Buffer.from(item.image.data).toString('base64');

    return (
      <Fade appear in key={item._id}>
        <Card style={{ width: '19rem' }}>
          <div className="center-img">
            <Card.Img
              variant="top"
              src={b64 ? `data:image/png;base64,${b64}` : placeholder}
            />
          </div>
          <Card.Body>
            <Card.Title>{item.name}</Card.Title>
            <Card.Text>
              {item.infotext}
              <span>Preis pro Produkt: {formatToCurrent(item.price)}</span>
            </Card.Text>
            <Button
              variant="primary"
              disabled={auth.isOrdered.includes(
                siteID ?? auth.sites[0]?._id ?? ''
              )}
              onClick={() => {
                setPopUpData((prev) => {

                  let existingOrder = auth.user?.order.find(
                    (order) => {
                      return order._id === `${item._id}-normal`;
                    }
                  );

                  return {
                    ...prev,
                    quantity: existingOrder?.quantity ?? 1,
                    comment: existingOrder?.comment ?? [],
                    sauce: existingOrder?.sauce,
                    name: item.name,
                    price: item.price,
                    _id: item._id,
                  };
                });
                setModalShow(true);
              }}
            >
              Bestellen
            </Button>
          </Card.Body>
        </Card>
      </Fade>
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const currentOrder = {
      _id: popUpData._id,
      name: popUpData.name,
      bread: formData.get('bread') as string,
      ketchup: (formData.get('ketchup') as string) ?? '0',
      mustard: (formData.get('mustard') as string) ?? '0',
      sweetMustard: (formData.get('sweetMustard') as string) ?? '0',
      quantity: formData.get('quantity') as string,
      comment: formData.getAll('comment'),
    };

    // send order to server
    sendOrder(currentOrder);

    // close PopUp
    setModalShow(false);
  };

  if (access === undefined)
    return (
      <div>
        <Menu needsAdmin onSearch={(e: any) => setSearch(e.target.value)} />
      </div>
    );

  return (
    <>
      <Menu needsAdmin onSearch={(e: any) => setSearch(e.target.value)} />
      <OrderPopup
        modalShow={modalShow}
        handleSubmit={handleSubmit}
        hideModal={() => setModalShow(false)}
        popUpData={popUpData}
        menuAdditions={
          menuAdditions.filter(
            (addition) => addition._id === (siteID ?? auth.sites[0]?._id)
          )[0]
        }
        isBreadSite={
          auth.sites.find(
            (site) => site?._id === (siteID ?? auth.sites[0]?._id)
          )?.isBreadSite ?? false
        }
      />

      <Container className="content">
        {auth.user && (
          <h3 className="mb-4">
            Hallo {auth.user.forename} {auth.user.surname}
          </h3>
        )}
        {auth.isOrdered.includes(siteID ?? auth.sites[0]?._id ?? '') && (
          <Alert variant={'danger'}>
            <Alert.Heading>Bereits bestellt!</Alert.Heading>
            Hier kannst du leider nichts mehr bestellen, da die Bestellung bereits
            abgeschickt wurde!
          </Alert>
        )}
        <Row className="justify-content-evenly">
          {menu
            .filter((item) => item.siteID === (siteID ?? auth.sites[0]?._id))
            .filter((item) => item.name.includes(search))
            .map((element: any) => {
              return generateItems(element);
            })}
        </Row>
      </Container>
      <Footer />
    </>
  );
}

export default DashboardPage;
