import { Card, Col, Container, Row } from "react-bootstrap";
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
import { useEffect, useState } from "react";

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
      }
   },
};

interface IStatisticsOrderCount {
   rank: string;
   counts: number;
   names: string;
}

interface IStatisticsPriceCount {
   rank: string;
   prices: number;
   names: string;
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

   const getRandomColor = () => {

      const colors = [
         "#1f77b4",
         "#ff7f0e",
         "#2ca02c",
         "#d62728",
         "#9467bd",
         "#8c564b",
         "#e377c2",
         "#7f7f7f",
         "#bcbd22",
         "#17becf",
         "#ff9896",
         "#f7b6d2",
         "#dbdb8d",
         "#9edae5",
         "#aec7e8",
      ]

      return colors[Math.floor(Math.random() * colors.length)]
   }

   if (ordercount === undefined || pricecount === undefined) return (<></>)


   return (
      <Row>
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
                        labels: ordercount[0] ? [...ordercount[0].names] : [],
                        datasets: ordercount.map((stat) => {
                           return {
                              label: "Bestellungen " + stat.rank,
                              data: stat.counts,
                              borderWidth: 1,
                           }
                        })
                     }}
                  />
               </Card.Body>
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
                        labels: pricecount[0] ? [...pricecount[0].names] : [],
                        datasets: pricecount.map((stat) => {
                           return {
                              label: "Gesamtausgaben" + stat.rank,
                              data: stat.prices,
                              borderWidth: 1,
                           }
                        })
                     }}
                  />
               </Card.Body>
            </Card>
         </Col>
      </Row>
   )
}
export default Statistics