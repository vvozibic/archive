import { useEffect, useState } from "react";
import "./App.css";

const useImage = (id) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [image, setImage] = useState(null)

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const response = await import(`./images/${id}`) // change relative path to suit your needs
                setImage(response.default)
            } catch (err) {
                setError(err)
            } finally {
                setLoading(false)
            }
        }

        fetchImage()
    }, [id])

    return {
        loading,
        error,
        image,
    }
}

const Image = ({ id, alt, className, ...rest }) => {
  const { loading, error, image } = useImage(id)

  if (error) return <span>{alt}</span>

  return (
      <>
          {loading ? (
              <span>loading</span>
          ) : (
              <img
                  className={`Image${
                      className
                          ? className.padStart(className.length + 1)
                          : ''
                  }`}
                  src={image}
                  alt={alt}
                  {...rest}
              />
          )}
      </>
  )
}

async function getData() {
  // https://stackoverflow.com/questions/31765773/converting-google-visualization-query-result-into-javascript-array
  // https://developers.google.com/chart/interactive/docs/dev/implementing_data_source#responseformat

  const spreadsheetId = "1LHSC41Hr_5PjfhAhrTvhlWNToHXgcQI6",
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
      <div className="logo"><Image id="logo.jpg" /></div>
      <h1>{!data.length && "Загрузка..."}</h1>
      <input placeholder="Поиск" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="flex">
        {data.filter(i => i.C?.toLowerCase().includes(search?.toLowerCase()) || i.B?.toLowerCase().includes(search?.toLowerCase())).map((item) => (
          <div>
            <Image id={`${item.A}.jpeg`} />
            <h3>{item.B} – {item.C}</h3>
            {/* <div>Альбом: <b> </b></div>
            <div>Исполнитель: <b> </b></div> */}
            {/* <div>Жанр: {item.D}</div> */}
            <br />
            <br />
            <div>Цена: {item.D} ₽</div>
            {/* <div>Состояние: {item.H}</div> */}
            {/* <div>Год: {item.K}</div> */}
            {/* <div>Лейбл: {item.M}</div> */}
            {/* <div>Страна: {item.N}</div> */}
          </div>
        ))}
      </div>

      <a className="tg-btn" href="https://t.me/archive_vinyl" target="_blank" rel="noreferrer"><Image id="telegram.png" /></a>
    </div>
  );
}
