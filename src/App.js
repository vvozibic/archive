import { useEffect, useRef, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";


const useImage = (id, shouldLoad = true) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [image, setImage] = useState(null)

    useEffect(() => {
        if (!shouldLoad) return;

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
    }, [id, shouldLoad])

    return {
        loading,
        error,
        image,
    }
}

const Image = ({ id, alt, className, eager = false, ...rest }) => {
  const [isInView, setIsInView] = useState(eager);
  const imgRef = useRef(null);

  useEffect(() => {
    // Если eager=true, загружаем сразу
    if (eager) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Начинаем загрузку за 50px до появления в viewport
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.disconnect();
      }
    };
  }, [eager]);

  const { loading, error, image } = useImage(id, isInView);

  if (error) return <span>{alt}</span>

  return (
      <div ref={imgRef} style={{ minHeight: loading ? '240px' : '240px' }}>
          {loading ? (
              <div style={{ 
                width: '240px', 
                height: '240px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#ffff'
              }}>
                <span>Загрузка...</span>
              </div>
          ) : (
              <img
                  className={`Image${
                      className
                          ? className.padStart(className.length + 1)
                          : ''
                  }`}
                  src={image}
                  loading="lazy"
                  alt={alt}
                  {...rest}
              />
          )}
      </div>
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
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(20); // Начальное количество элементов
  const [isLoading, setIsLoading] = useState(true);
  const loadMoreRef = useRef(null);
  const ITEMS_PER_PAGE = 20; // Количество элементов для загрузки за раз

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getData();
      setData(data.reverse());
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Фильтрация данных по поисковому запросу
  const filteredData = data.filter(i => 
    i.C?.toLowerCase().includes(search?.toLowerCase()) || 
    i.B?.toLowerCase().includes(search?.toLowerCase())
  );

  // Сброс счетчика при изменении поиска
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [search]);

  // Отображаемые элементы
  const displayedData = filteredData.slice(0, displayCount);
  const hasMore = displayCount < filteredData.length;

  // Intersection Observer для автолоадинга
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => {
            const next = prev + ITEMS_PER_PAGE;
            return Math.min(next, filteredData.length);
          });
        }
      },
      { rootMargin: '100px' } // Начинаем загрузку за 100px до конца
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.disconnect();
      }
    };
  }, [hasMore, isLoading, filteredData.length]);

  return (
    <>
      <div className="logo"><Image id="logo.jpg" eager /></div>
      <h1>{isLoading && "Загрузка..."}</h1>
      <input 
        placeholder="Поиск" 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
      />

      {!isLoading && filteredData.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '40px' }}>
          Ничего не найдено
        </p>
      )}

      <section className="s-cards container">
        <section className="s-cards__inner">
          {displayedData.map((item) => (
            <section className="s-card" key={item.A}>
              <Image id={`${item.A}.jpeg`} alt={`${item.B} – ${item.C}`} /> 
              <h3 className="s-card__name">{item.B} – {item.C}</h3>
              <p className="s-card__price">Цена: {item.D} ₽</p>
              <div className="s-card__btns">
                {/* <a href="./product.html" class="btn btn--clear-black">Подробнее</a> */}
                {/* <button class="btn btn--fill">В корзину</button> */}
              </div>
            </section>
          ))}
        </section>
        
        {/* Элемент для отслеживания скролла */}
        {hasMore && (
          <div 
            ref={loadMoreRef} 
            style={{ 
              textAlign: 'center', 
              padding: '20px',
              minHeight: '50px'
            }}
          >
            <span>Загрузка...</span>
          </div>
        )}

        {!hasMore && filteredData.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            color: '#666'
          }}>
            Показано {filteredData.length} из {filteredData.length}
          </div>
        )}
      </section>

      <a className="tg-btn" href="https://t.me/archive_vinyl" target="_blank" rel="noreferrer">
        <Image id="telegram.png" eager />
      </a>
    </>
  );
}

const Main = () => {
  return (<>
    <div className="logo"><Image id="logo.jpg" eager /></div>
    <div className="cards">
      <a href="/catalog"><div className="card catalog"><Image id="icon-main.png" eager /></div>Каталог</a>
      <a href="https://t.me/archive_vinylshop" target="_blank" rel="noreferrer"><div className="card tg"><Image id="icon-tg.png" eager /></div>Телеграмм</a>
      <a href="https://instagram.com/archive_shop" target="_blank" rel="noreferrer"><div className="card inst"><Image id="icon-inst.png" eager /></div>Инстаграм</a>
      <a href="https://www.youtube.com/@radiofromarchive"><div className="card yt"><Image id="icon-yt.png" eager /></div>Ютуб</a>
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
    </div>
  )
}