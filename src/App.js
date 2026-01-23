import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
                  lazy="true"
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

  const spreadsheetId = "1rTv1YmAD-AQBgYYsOjOO2LxVkiHrpHrfjFRmBz5brZc",
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

  const headings = json.table.cols.map((item) => item.id);

  let data = json.table.rows.map((item) => {
    let row = {};
    item.c.forEach((cell, idx) => {
      row[headings[idx]] = cell?.v;
    });
    return row;
  });

  data = data.filter((o) => o.A && o.B && o.G > 0);
  // data = data.filter((o) => o.A && o.B);

  return data;
}

function Archive() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      setData(data.reverse());
      // console.log(data);
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="logo"><Image id="logo.jpg" /></div>
      <h1>{!data.length && "Загрузка..."}</h1>
      <input placeholder="Поиск" value={search} onChange={e => setSearch(e.target.value)} />

      {/* <div className="flex">
        {data.filter(i => i.C?.toLowerCase().includes(search?.toLowerCase()) || i.B?.toLowerCase().includes(search?.toLowerCase())).map((item) => (
          <div key={item.A}>
            <Image id={`${item.A}.jpeg`} />
            <h3>{item.B} – {item.C}</h3>
            {item.H && <div>{item.H}</div>}
            <br />
            <br />
            <div>Цена: {item.D} ₽</div>
          </div>
        ))}
      </div> */}

      <section class="s-cards container">
        <section class="s-cards__inner">
          {data.filter(i => i.C?.toLowerCase().includes(search?.toLowerCase()) || i.B?.toLowerCase().includes(search?.toLowerCase())).map((item) => (
            // <div key={item.A}>
            //   <Image id={`${item.A}.jpeg`} />
            //   <h3>{item.B} – {item.C}</h3>
            //   {item.H && <div>{item.H}</div>}
            //   <br />
            //   <br />
            //   <div>Цена: {item.D} ₽</div>
            // </div>

            <section class="s-card"  key={item.A}>
              <Image id={`${item.A}.jpeg`} alt={`${item.B} – ${item.C}`} loading="lazy" /> 
              <h3 class="s-card__name">{item.B} – {item.C}</h3>
              <p class="s-card__price">Цена: {item.D} ₽</p>
              <div class="s-card__btns">
                {/* <a href="./product.html" class="btn btn--clear-black">Подробнее</a> */}
                {/* <button class="btn btn--fill">В корзину</button> */}
              </div>
            </section>
          ))}
        </section>
        {/* <a class="btn btn--clear-black btn--fixed-width" href="./catalog.html">Показать ещё</a> */}

      </section>

      <a className="tg-btn" href="https://t.me/archive_vinyl" target="_blank" rel="noreferrer"><Image id="telegram.png" /></a>
    </>
  );
}

const Main = () => {
  return (<>
    <div className="logo"><Image id="logo.jpg" /></div>
    <div className="cards">
      <a href="/catalog"><div className="card catalog"><Image id="icon-main.png" /></div>Каталог</a>
      <a href="https://t.me/archive_vinylshop" target="_blank" rel="noreferrer"><div className="card tg"><Image id="icon-tg.png" /></div>Телеграмм</a>
      <a href="https://instagram.com/archive_shop" target="_blank" rel="noreferrer"><div className="card inst"><Image id="icon-inst.png" /></div>Инстаграм</a>
      <a href="https://www.youtube.com/@radiofromarchive"><div className="card yt"><Image id="icon-yt.png" /></div>Ютуб</a>
    </div>
  </>)
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
  },
  {
    path: "/catalog",
    element: <Archive />
  }
]);

export default function App () {
  return (
    <div className="App">
      <RouterProvider router={router} />
      <Analytics />
    </div>
  )
}