import * as React from 'react';
import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import GitHubIcon from '@mui/icons-material/GitHub';
import HelpIcon from '@mui/icons-material/Help';
import Modal from '@mui/material/Modal'; // Import Modal component
import Typography from '@mui/material/Typography';

const actions = [
  { icon: <GitHubIcon />, name: 'Github' },
  { icon: <HelpIcon />, name: 'How To Play' },
];

export default function BasicSpeedDial() {
  const [openModal, setOpenModal] = React.useState(false);

  const handleOpenModal = (name: string) => {
    if (name === 'Github'){
        window.open('https://github.com/iamyanbo/Ylinko', '_blank');
    }
    if (name === 'How To Play'){
        setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <Box sx={{ height: 320, transform: 'translateZ(0px)', flexGrow: 1, margin: 4}}>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        icon={<SpeedDialIcon />}
        direction="down"
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => handleOpenModal(action.name)}
          />
        ))}
      </SpeedDial>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                How To Play
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                1. Click "Drop Ball" or press space to drop a ball.
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                2. Toggle percentage of balls to drop each time or set a custom amount.
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                3. Watch the balls fall and see where they land.
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                4. Try to get the balls in the highest scoring slots.
            </Typography>
        </Box>
      </Modal>
    </Box>
  );
}
