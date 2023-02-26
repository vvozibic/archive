import { useEffect, useState } from "react";
import "./App.css";

async function getData() {
  // https://stackoverflow.com/questions/31765773/converting-google-visualization-query-result-into-javascript-array
  // https://developers.google.com/chart/interactive/docs/dev/implementing_data_source#responseformat

  const spreadsheetId = "13uLS53VilSZjAdQIz7DXetmn-ktiOL_Zlk-6Ie17j_k",
    response = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`
    ),
    result = await response.text(),
    json = JSON.parse(
      result.replace(
        /.*google.visualization.Query.setResponse\({(.*?)}\);?/s,
        "{$1}"
      )
    );

  // console.log(json);

  // `table.cols` element contains headings
  // we will use them to build our data array
  const headings = json.table.cols.map((item) => item.id);

  console.log(json, headings);

  // console.log(headings);

  // data of each row is associated to the headings
  let data = json.table.rows.map((item) => {
    // console.log(item);
    let row = {};
    item.c.forEach((cell, idx) => {
      // console.log(cell)
      row[headings[idx]] = cell?.v;
    });
    // console.log(row)
    return row;
  });

  data = data.filter((o) => o.A && o.B);

  // filtering and sorting
  // data = data.filter(item => item.Publish === true);
  // data.sort((a, b) => a.CategoryOrder > b.CategoryOrder);

  // console.log(data);

  /*
    Fields:
    -------------------
    Category
    Name
    Description
    Price
    Publish
    CategoryOrder
    CategoryTranslation
  */

  // aggregating data by category
  // data = [...new Set(data.map(item => item.CategoryOrder))].map(categoryIndex => {
  //   return data.filter(item => item.CategoryOrder === categoryIndex);
  // });

  return data;
}

export default function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      setData(data);
      console.log(data);
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <h1>{data.length ? "Список пластинок" : "Загрузка..."}</h1>
      <input placeholder="Поиск" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="flex">
        {data.filter(i => i.C?.includes(search) || i.B?.includes(search)).map((item) => (
          <div>
            <div>Альбом: <b> {item.C}</b></div>
            <div>Исполнитель: <b> {item.B}</b></div>
            <div>Жанр: {item.D}</div>
            <div>Цена: {item.E}</div>
            <div>Состояние: {item.H}</div>
            <div>Год: {item.K}</div>
            <div>Лейбл: {item.M}</div>
            <div>Страна: {item.N}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
