import { render, screen, server, waitFor } from '@tests/utils';
import { http, HttpResponse } from 'msw';

import { ListPageCE } from '../ListPage';

describe('Users | ListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show a list of users', async () => {
    const { findByText } = render(<ListPageCE />);

    await findByText('John');
    await findByText('Kai');
  });

  it('should remove a deleted user from the list without a page reload', async () => {
    let isDeleted = false;

    server.use(
      http.get('/admin/users', () =>
        HttpResponse.json({
          data: {
            results: isDeleted
              ? [{ id: 1, firstname: 'John', lastname: 'Doe', roles: [] }]
              : [
                  { id: 1, firstname: 'John', lastname: 'Doe', roles: [] },
                  { id: 2, firstname: 'Kai', lastname: 'Doe', roles: [] },
                ],
            pagination: { page: 1 },
          },
        })
      ),
      http.post('/admin/users/batch-delete', () => {
        isDeleted = true;

        return HttpResponse.json({ data: { count: 1 } });
      })
    );

    const { findByText, queryByText, user } = render(<ListPageCE />);

    await findByText('Kai');

    await user.click(screen.getByRole('button', { name: 'Delete Kai Doe' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(queryByText('Kai')).not.toBeInTheDocument());
    await findByText('John');
  });
});
