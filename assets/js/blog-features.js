document.addEventListener('DOMContentLoaded', () => {
    const slug = window.location.pathname.split('/').pop().replace('.html', '');
    const viewsEl = document.getElementById('view-count');
    const commentList = document.getElementById('comment-list');
    const commentForm = document.getElementById('comment-form');

    // 1. Fetch and Increment Views
    fetch(`/api/views?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
            if (viewsEl) viewsEl.innerText = `${data.views || 0} views`;
        })
        .catch(err => console.error('Error fetching views:', err));

    // 2. Fetch Comments
    function loadComments() {
        fetch(`/api/comments?slug=${slug}`)
            .then(res => res.json())
            .then(data => {
                if (!commentList) return;
                if (data.length === 0) {
                    commentList.innerHTML = '<p class="text-sm text-text-muted italic">No comments yet. Be the first to comment!</p>';
                    return;
                }
                commentList.innerHTML = data.map(c => `
                    <div class="border-b border-border-col pb-4 mb-4">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-sm text-text-main">${c.user_name}</span>
                            <span class="text-[10px] text-text-muted">${new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-text-muted">${c.comment_text}</p>
                    </div>
                `).join('');
            });
    }

    loadComments();

    // 3. Post Comment
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('comment-name').value;
            const comment = document.getElementById('comment-text').value;
            const btn = commentForm.querySelector('button');

            if (!name || !comment) return;

            btn.disabled = true;
            btn.innerText = 'Posting...';

            try {
                const res = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug, name, comment })
                });

                if (res.ok) {
                    document.getElementById('comment-text').value = '';
                    loadComments();
                }
            } catch (err) {
                alert('Error posting comment. Please try again.');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Post Comment';
            }
        });
    }
});
