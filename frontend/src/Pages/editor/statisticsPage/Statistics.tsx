import { Card, Carousel, Col, Container, Row } from "react-bootstrap";
import { Chart, CategoryScale, ArcElement, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, Filler, Colors } from 'chart.js'
Chart.register(CategoryScale,
   Colors,
   LinearScale,
   ArcElement,
   BarElement,
   LineElement,
   Title,
   Filler,
   Tooltip,
   PointElement,
   Legend);
import { Bar, Line } from "react-chartjs-2"

import "./Statistics.css"
import { StatisticRequest } from "modules/requester";
import { useAuth } from "src/authentication/authHandler";
import { SetStateAction, useEffect, useState } from "react";
import Menu from "modules/menu/Menu";

export interface ISingleOrder {
   orderCount: number;
   orderPrice: number;
   orderName: string;
}

export type IStatistics = any;

const options = {
   responsive: true,
   plugins: {
      legend: {
         position: 'top' as const,
         display: true
      }
   },
};

interface IStatisticsOrderCount {
   rank: string;
   counts: number[];
   names: string[];
}

interface IStatisticsPriceCount {
   rank: string;
   prices: number[];
   names: string[];
}

function Statistics() {

   const auth = useAuth()

   const [ordercount, setOrderCount] = useState<IStatisticsOrderCount[]>()
   const [pricecount, setPriceCount] = useState<IStatisticsPriceCount[]>()

   // 4 statistics for the dashboard in a grid layout
   // 1. Gesamtausgaben pro Jahr
   // 2. Wie viel wurde bestellt? 
   // 3. Barstatisik für einzelne Menüitems
   // 4. Wer hat am meisten gelaufen?

   useEffect(() => {
      getData()
   }, [])

   const getData = () => {
      // fetch data from backend
      StatisticRequest(auth, () => { }).get({}, 'ordercount', (data) => {
         console.log(data);
         if (data === undefined) return

         setOrderCount(data.res as IStatisticsOrderCount[])
      })

      StatisticRequest(auth, () => { }).get({}, 'pricecount', (data) => {
         console.log(data);
         if (data === undefined) return

         setPriceCount(data.res as IStatistics[])
      })
   }

   const getLegend = () => {

   }

   if (ordercount === undefined || pricecount === undefined) return (<></>)

   return (
      <>
         <Menu />
         <Container className="content dashboard">
            <Col>
               <Card className="statistics__card">
                  <Card.Body>
                     <Card.Title>Wie viel wurde bestellt in diesem Jahr?</Card.Title>
                     <Bar
                        options={{
                           ...options,
                           scales: {
                              y: {
                                 ticks: {
                                    // Include a dollar sign in the ticks
                                    callback: function (value: any, index: any, ticks: any) {
                                       return value + "x"
                                    }
                                 }
                              }
                           }
                        }}
                        data={{
                           labels: ordercount[0] ? [...(ordercount[0].names.map((_, index) => index + 1))] : [],
                           datasets: ordercount.map((stat) => {
                              return {
                                 label: stat.rank,
                                 data: stat.counts,
                                 borderWidth: 1,
                              }
                           })
                        }}
                     />
                  </Card.Body>
                  <Card.Footer>
                     <Row>
                        <Col>
                           <h5>Legende</h5>
                           {
                              ordercount[0].names.map((item, index) => {
                                 return <div>
                                    {index + 1}: {item}
                                 </div>
                              })
                           }
                        </Col>
                        <Col>
                           <h5>Summe</h5>
                           {
                              ordercount.map((item) => {
                                 const priceMax = item.counts.reduce((acc, curr) => acc + curr, 0)


                                 return <div>
                                    {item.rank}: {priceMax} Bestellungen
                                 </div>
                              })
                           }
                        </Col>
                     </Row>
                  </Card.Footer>
               </Card>
            </Col>
            <Col>
               <Card className="statistics__card">
                  <Card.Body>
                     <Card.Title>Gesamtausgaben in diesem Jahr</Card.Title>
                     <Bar
                        options={{
                           ...options,
                           scales: {
                              y: {
                                 ticks: {
                                    // Include a dollar sign in the ticks
                                    callback: function (value: any, index: any, ticks: any) {
                                       return Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
                                    }
                                 }
                              }
                           }
                        }}
                        data={{
                           labels: pricecount[0] ? [...(pricecount[0].names.map((_, index) => index + 1))] : [],
                           datasets: pricecount.map((stat) => {
                              return {
                                 label: stat.rank,
                                 data: stat.prices,
                                 borderWidth: 1,
                              }
                           })
                        }}
                     />
                  </Card.Body>
                  <Card.Footer>
                     <Row>
                        <Col>
                           <h5>Legende</h5>
                           {
                              pricecount[0].names.map((item, index) => {
                                 return <div>
                                    {index + 1}: {item}
                                 </div>
                              })
                           }
                        </Col>
                        <Col>
                           <h5>Summe</h5>
                           {
                              pricecount.map((item) => {
                                 const priceMax = item.prices.reduce((acc, curr) => acc + curr, 0)


                                 return <div>
                                    {item.rank}: {Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(priceMax)}
                                 </div>
                              })
                           }
                        </Col>
                     </Row>
                  </Card.Footer>
               </Card>
            </Col>
         </Container>
      </>
   )
}
export default Statistics