import React from "react";
import Link from "./Link";
import { Query } from "react-apollo";
import gql from "graphql-tag";

export const FEED_QUERY = gql`
  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      count
    }
  }
`;

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`;

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`;

const LINKS_PER_PAGE = 3;

const LinkList = ({ location, match, history }) => {
  const _getQueryVariables = () => {
    const isNewPage = location.pathname.includes("new");
    const page = parseInt(match.params.page, 10);

    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const first = isNewPage ? LINKS_PER_PAGE : Infinity;
    const orderBy = isNewPage ? "createdAt_DESC" : null;

    return { skip, first, orderBy };
  };

  const _updateCacheAfterVote = (store, createVote, linkId) => {
    const data = store.readQuery({ query: FEED_QUERY });
    const votedLink = data.feed.links.find(link => link.id === linkId);
    votedLink.votes = createVote.link.votes;

    store.writeQuery({ query: FEED_QUERY, data });
  };

  const _subscribeToNewLinks = subscribeToMore => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newLink = subscriptionData.data.newLink;
        const exists = prev.feed.links.find(({ id }) => id === newLink.id);
        if (exists) return prev;

        return Object.assign({}, prev, {
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename
          }
        });
      }
    });
  };

  const _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION
    });
  };

  const _getLinksToRender = data => {
    const isNewPage = location.pathname.includes("new");
    if (isNewPage) {
      return data.feed.links;
    }

    const rankedLinks = data.feed.links.slice();
    rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length);
    return rankedLinks;
  };

  const _nextPage = data => {
    const page = parseInt(match.params.page, 10)
    if (page <= data.feed.count / LINKS_PER_PAGE) {
      const nextPage = page + 1
      history.push(`/new/${nextPage}`)
    }
  }

  const _previousPage = () => {
    const page = parseInt(match.params.page, 10)
    if (page > 1) {
      const previousPage = page - 1
      history.push(`/new/${previousPage}`)
    }
  }

  return (
    <Query query={FEED_QUERY} variables={_getQueryVariables()}>
      {({ loading, error, data, subscribeToMore }) => {
        if (loading) return <div>Fetching</div>;
        if (error) return <div>Error</div>;
        _subscribeToNewLinks(subscribeToMore);
        _subscribeToNewVotes(subscribeToMore);

        const linksToRender = _getLinksToRender(data);
        const isNewPage = location.pathname.includes("new");
        const pageIndex = match.params.page
          ? (match.params.page - 1) * LINKS_PER_PAGE
          : 0;

        return (
          <>
            {isNewPage && (
              <div className="flex ml4 mv3 gray">
                <div className="pointer mr2" onClick={_previousPage}>
                  Previous
                </div>
                <div className="pointer" onClick={() => _nextPage(data)}>
                  Next
                </div>
              </div>
            )}
            {linksToRender.map((link, i) => (
              <Link
                key={link.id}
                {...link}
                index={i + pageIndex}
                updateStoreAfterVote={_updateCacheAfterVote}
              />
            ))}
          </>
        );
      }}
    </Query>
  );
};

export default LinkList;
