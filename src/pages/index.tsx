import { GetStaticProps } from 'next';
import Header from '../components/Header';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi'

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { ptBR } from 'date-fns/locale';
import Head from 'next/head';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
    readTime: number;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR
        }
      ),
    };
  });

  console.log(formattedPost);

  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, SetNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage(): Promise<void> {
    if (currentPage != 1 && nextPage === null) {
      return;
    }

    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    SetNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page)

    const newPosts = postsResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <main className={commonStyles.container}>

        <Head>
          <title>Home | spacetraveling</title>
        </Head>

        <Header />

        <div className={styles.posts}>

          {posts.map(post => (
            <Link
              key={post.uid}
              href={`/post/${post.uid}`}
            >
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <ul>
                  <li>
                    <FiCalendar />
                    {post.first_publication_date}
                  </li>
                  <li>
                    <FiUser />
                    {post.data.author}
                  </li>
                  <li>
                    <FiClock />
                    {`${post.data.readTime} min`}
                  </li>
                </ul>
              </a>
            </Link>

          ))
          }

          {nextPage && (
            <button
              type='button'
              onClick={handleNextPage}
            >
              Carregar mais posts
            </button>

          )}

        </div>

      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts'),
    ], {
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }

  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }

  return {
    props: {
      postsPagination,
    }
  }
};
