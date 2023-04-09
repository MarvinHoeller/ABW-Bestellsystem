import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  FormControl,
  InputGroup,
  Row,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { ISiteSettingsSchema } from 'schemas/Schemas';
import { useAuth } from '../../../../authentication/authHandler';
import infoPopup from '../../../../modules/infoPopup';
import { CustomPageRequest, MenuRequest } from '../../../../modules/requester';
import { formatToCurrent } from '../../../../modules/Tools';
import './Settings.css';

export function CustomPageSettings({
  toggleMenuItem: toggleMenuItem,
  toggleIngredient: toggleIngredient,
}: {
  toggleMenuItem: (toggle: boolean) => void;
  toggleIngredient: (toggle: boolean) => void;
}) {
  const [globalSettings, setGlobalSettings] =
    useState<Array<ISiteSettingsSchema>>();

  const [localSettings, setLocalSettings] = useState<ISiteSettingsSchema>({
    _id: '',
    autoDelete: false,
    autoDeleteTime: '',
    emails: [''],
    sitename: '',
    usingEmails: false,
    visible: true,
    isBreadSite: false,
  });

  const navigate = useNavigate();
  const auth = useAuth();
  const { siteID } = useParams();


  useEffect(() => {
    getSettings();
  }, []);

  useEffect(() => {
    getLocalSettings();
    console.log('refresh localsettings');
  }, [siteID, globalSettings]);

  const getSettings = async () => {
    CustomPageRequest(auth, () => navigate('/dashboard')).get({},
      'settings',
      (data) => {
        setGlobalSettings(data.res);
      }
    );
  };

  const removeMenuAddition = async (ingredientID: string) => {
    MenuRequest(auth, () => navigate(''), siteID).erase(
      { ingredientID: ingredientID },
      'ingredient',
      (data) => {
        infoPopup.success('Bestellzusatz wurde gelöscht!', 'Zusatz gelöscht!');
        getSettings();
      }
    );
  };

  const deleteSite = async () => {
    CustomPageRequest(auth, () => navigate('/'), siteID).erase(
      {},
      //TODO: Route hinzufügen
      'site',
      (data) => {
        infoPopup.success('Seite wurde gelöscht!', 'Seite gelöscht!');
        auth.getSites();
        navigate('/');
      }
    );
  };

  const deleteRunners = async () => {
    CustomPageRequest(auth, () => navigate('/'), siteID).erase(
      {},
      'runners',
      (data) => {
        infoPopup.success('Alle Runner wurden gelöscht!', 'Runner gelöscht!');
      }
    );
  };

  //Delete all Userorders
  const deleteUserOrders = async () => {
    CustomPageRequest(auth, () => navigate('/'), siteID).erase(
      {},
      'userorders',
      (data) => {
        infoPopup.success(
          'Alle Bestellungen wurden gelöscht!',
          'Bestellungen gelöscht!'
        );
      }
    );
  };

  const getLocalSettings = (): void => {
    if (!globalSettings) return;

    const newConfig: ISiteSettingsSchema = {
      _id: '',
      autoDelete: false,
      autoDeleteTime: '',
      emails: [''],
      sitename: '',
      usingEmails: false,
      visible: true,
      isBreadSite: false,
    };

    setLocalSettings(
      globalSettings.find((config) => config._id === siteID) ?? newConfig
    );
  };

  const getMenuAdditions = () => {
    const menuAdditions = localSettings.menuAdditions;

    if (!menuAdditions) return null;

    return menuAdditions.map(
      (addition: { _id: string; name: string; price: number }) => {
        return (
          <li
            title={addition.name}
            key={addition.name}
            onClick={() => removeMenuAddition(addition._id)}
          >
            {addition.name}: {formatToCurrent(addition.price)}
          </li>
        );
      }
    );
  };

  const changeSwitchSettings = async (
    setting: EventTarget & HTMLInputElement
  ) => {
    if (!globalSettings) return;

    console.log(setting.name, setting.checked);

    // set Editorconfig. Used for switiching between sites and save the last modified state
    setGlobalSettings(
      [...globalSettings].map((singleconfig: ISiteSettingsSchema) => {
        if (singleconfig._id === siteID) {
          return {
            ...singleconfig,
            [setting.name]: setting.checked,
          };
        } else return singleconfig;
      })
    );

    CustomPageRequest(auth, () => navigate('/'), siteID).post(
      {
        setting: { ...localSettings, [setting.name]: setting.checked },
      },
      'settings',
      (data) => {
        infoPopup.success(
          `Einstellungen wurden erfolgreich geändert!`,
          'Erfolgreich'
        );
      }
    );
  };

  /**
   * TODO: Oben und unten CustomPagereq. vlt vereinen?
   */

  const changeSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!globalSettings) return;

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    if (formData.emails)
      // @ts-ignore
      formData.emails = formData.emails.split(',').map((email: string) => email.trim());

    // set Editorconfig. Used for switiching between sites and save the last modified state
    setGlobalSettings(
      [...globalSettings].map((singleconfig) => {
        if (singleconfig._id === siteID) {
          return {
            ...singleconfig,
            ...formData
          };
        } else return singleconfig;
      })
    );

    CustomPageRequest(auth, () => navigate('/'), siteID).post(
      {
        setting: { ...localSettings, ...formData },
      },
      'settings',
      (data) => {
        infoPopup.success(
          `Einstellungen wurden erfolgreich geändert!`,
          'Erfolgreich'
        );
      }
    );
  };

  if (!globalSettings) return <></>;


  return (
    <Card className="settingscard">
      <h5>Automatische Löschzeit</h5>
      <Row>
        <Form onSubmit={changeSettings}>
          <Col className="mt-2  mb-1">
            <InputGroup className="manage">
              <FormControl
                placeholder="Löschzeit der Bestellungen"
                aria-label="Löschzeit der Bestellungen"
                type="time"
                name="autoDeleteTime"
                aria-describedby="autoDeleteButton"
                value={localSettings.autoDeleteTime}
                onChange={(e) =>
                  setGlobalSettings(
                    [...globalSettings].map((singleconfig) => {
                      if (singleconfig._id === siteID) {
                        return {
                          ...singleconfig,
                          autoDeleteTime: e.target.value,
                        };
                      } else return singleconfig;
                    })
                  )
                }
              />
              <Button
                variant="primary"
                type="submit"
                id="autoDeleteButton"
                name="pickUp"
              >
                Refresh
              </Button>
            </InputGroup>
          </Col>
        </Form>
      </Row>
      <Row className="mb-4">
        <Col>
          <Form.Check
            type="switch"
            label="Automatisches Löschen Aus/An"
            name="autoDelete"
            checked={localSettings.autoDelete}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              changeSwitchSettings(e.target);
            }}
          />
        </Col>
      </Row>
      <h5>Seiten Einstellungen</h5>
      <Row className="mb-4 ms-0">
        <Form.Check
          type="switch"
          label="Seite sichtbar Aus/An"
          name="visible"
          checked={localSettings.visible}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            changeSwitchSettings(e.target);
          }}
        />{' '}
        <Form.Check
          type="switch"
          label="Emails Aus/An"
          name="usingEmails"
          checked={localSettings.usingEmails}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            changeSwitchSettings(e.target);
            setLocalSettings({
              ...localSettings,
              usingEmails: e.target.checked
            })
          }}
        />
      </Row>
      {localSettings.usingEmails ? (
        <>
          <h5>Emailempfänger</h5>
          <Row>
            <Form key={siteID + '-email'} onSubmit={changeSettings}>
              <Col className="mt-2 mb-4">
                <InputGroup className="manage">
                  <FormControl
                    placeholder="Email-Adressen, getrennt durch Kommas"
                    aria-label="Email-Adressen, getrennt durch Kommas"
                    type="text"
                    name="emails"
                    aria-describedby="EmailButton"
                    value={localSettings.emails}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setLocalSettings({
                        ...localSettings,
                        emails: e.target.value.split(',')
                      })
                    }}
                  />
                  <Button variant="primary" type="submit" id="EmailButton">
                    Refresh
                  </Button>
                </InputGroup>
              </Col>
            </Form>
          </Row>
        </>
      ) : (
        <></>
      )}
      <h5>Menüverwaltung</h5>
      <Row>
        <Col>
          <Button onClick={() => toggleMenuItem(true)} variant="primary">
            Menüitem hinzufügen
          </Button>
        </Col>
        <Col>
          <Button onClick={() => deleteUserOrders()} variant="danger">
            Bestellungen von Usern löschen
          </Button>
        </Col>

        <Col className="mb-4">
          <Button onClick={() => toggleIngredient(true)} variant="primary">
            Bestellungszusatz hinzufügen
          </Button>
        </Col>
      </Row>
      {localSettings.menuAdditions && localSettings.menuAdditions.length > 0 ? (
        <>
          <h5>Bestellzusätze</h5>
          <Row>
            <Col>
              <ul id="menuAdditions">{getMenuAdditions()}</ul>
            </Col>
          </Row>
        </>
      ) : null}
      <h5>Weitere Optionen</h5>
      <Row>
        <Col className="mb-4">
          <Button onClick={() => deleteRunners()} variant="info">
            Aktuelle Läufer löschen
          </Button>
        </Col>
        <Col>
          <Button onClick={() => deleteSite()} variant="danger">
            Bestellseite löschen
          </Button>
        </Col>
      </Row>
    </Card>
  );
}
