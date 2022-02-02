import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import Link from 'next/link';
import ptBR, { format } from 'date-fns';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
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
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadNextPosts(): Promise<void> {
    await fetch(nextPage).then(result =>
      result.json().then(nextPosts => {
        setPosts([...posts, ...nextPosts.results]);
        setNextPage(nextPosts.next_page);
      })
    );
  }

  return (
    <div className={commonStyles.container}>
      <main className={styles.posts}>
        {posts.map(post => {
          return (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <div className={styles.post}>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <FiCalendar />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    ).toLowerCase()}
                  </span>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          );
        })}

        {nextPage && (
          <button
            type="button"
            className={styles.loadPosts}
            onClick={handleLoadNextPosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 4,
    }
  );

  const { next_page } = postsResponse;
  const posts = postsResponse.results.map((post: Post) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: post.data,
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page,
      },
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
