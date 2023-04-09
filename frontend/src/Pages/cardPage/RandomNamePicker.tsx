import axios from 'axios';
import { useEffect, useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { useAuth } from '../../authentication/authHandler';
import config from '../../config';
import infoPopup from '../../modules/infoPopup';
import { UserRequest } from '../../modules/requester';
import { ResponseData } from '../../../schemas/Schemas';

interface users {
  forename: string;
  surname: string;
  _id: string;
}

function RandomNamePicker({ siteID }: { siteID: string }) {
  const [names, setNames] = useState<Array<users>>([]);
  const [winner, setWinner] = useState('');

  const [loopName, setloopName] = useState('');

  const auth = useAuth();

  const getNames = () => {
    UserRequest(auth, () => {}, siteID).get({},'runner', (data: any) => {
      setNames(data.res.users);
      setWinner(data.res.runner);
    });
  };

  const handleRunnerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    UserRequest(auth, () => {}, siteID).post({}, 'runner', (data: any) => {
      if (data.res.runner)
        infoPopup.warning('Es wurde schon ein Läufer gewählt', 'Glück gehabt!');
      else infoPopup.success(data.res, 'Danke dir!');
      getNames();
    });
  };

  useEffect(() => {
    getNames();
  }, [siteID]);

  useEffect(() => {
    if (names && names.length) epicReveal();
  }, [names, siteID]);

  const epicReveal = () => {
    const interval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];

      if (randomName)
        setloopName(`${randomName.forename} ${randomName.surname}`);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setloopName(winner);
    }, 2000);
  };

  return (
    <>
      {winner === '' || !winner ? (
        <>
          <Form onSubmit={handleRunnerSubmit}>
            <Card.Title>
              <h2>Aktuell gibt es noch keinen Läufer</h2>
            </Card.Title>
            <p className="mt-3">Willst du dich freiwillig melden?</p>
            <Card.Text>
              <Button type="submit" variant="primary">
                Melde dich jetzt an!
              </Button>
            </Card.Text>
          </Form>
        </>
      ) : (
        <>
          <Card.Title>
            <h2>Der heutige Läufer ist</h2>
          </Card.Title>
          <Card.Text>
            {/* Loop through all users with intervall */}
            <b>{loopName}</b>
          </Card.Text>
        </>
      )}
    </>
  );
}

export default RandomNamePicker;
