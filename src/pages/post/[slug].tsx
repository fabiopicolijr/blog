import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import ptBR, { format } from 'date-fns';

import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const estimatedTimeToRead = useMemo(() => {
    const humanWordsPerMinute = 200;

    const contentWords = post.data.content.reduce(
      (accum, { heading, body }) => {
        const headingWordCount = heading.split(/\s/g).length;
        const bodyWordCount = body.reduce((accumText, { text }) => {
          const textWordCount = text.split(/\s/g).length;
          return accumText + textWordCount;
        }, 0);

        return accum + headingWordCount + bodyWordCount;
      },
      0
    );

    return Math.ceil(contentWords / humanWordsPerMinute);
  }, [post.data.content]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>

      <img
        className={styles.postImage}
        src={post.data.banner.url}
        alt="Banner"
      />

      <div className={commonStyles.container}>
        <main className={styles.post}>
          <h1>{post.data.title}</h1>
          <FiCalendar />
          <span>
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            }).toLocaleLowerCase()}
          </span>
          <FiUser />
          <span>{post.data.author}</span>
          <FiClock />
          <span>{estimatedTimeToRead} min</span>

          {post.data.content.map(({ heading, body }) => {
            return (
              <div key={heading} className={styles.postContent}>
                <h2>{heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(body),
                  }}
                />
              </div>
            );
          })}
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: { post: response },
  };
};
