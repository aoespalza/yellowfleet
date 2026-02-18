import { Machine } from '../../domain/fleet/Machine';
import { MachineStatus } from '../../domain/fleet/MachineStatus';
import { CreateMachine } from '../../application/fleet/CreateMachine';
import { ChangeMachineStatus } from '../../application/fleet/ChangeMachineStatus';
import { GetMachineById } from '../../application/fleet/GetMachineById';
import { ListMachines } from '../../application/fleet/ListMachines';
import { IMachineRepository } from '../../application/fleet/IMachineRepository';

describe('Machine Entity', () => {
  const createMachineProps = {
    code: 'MAQ001',
    type: 'Excavator',
    brand: 'Caterpillar',
    model: '320',
    year: 2022,
    serialNumber: 'CAT032022001',
    hourMeter: 1500,
    acquisitionDate: new Date('2022-01-15'),
    acquisitionValue: 150000,
    usefulLifeHours: 10000,
    status: MachineStatus.AVAILABLE,
    currentLocation: 'Warehouse A',
  };

  describe('Machine.create', () => {
    it('should create a machine with AVAILABLE status', () => {
      const machine = Machine.create(createMachineProps);

      expect(machine.code).toBe('MAQ001');
      expect(machine.status).toBe(MachineStatus.AVAILABLE);
      expect(machine.hourMeter).toBe(1500);
    });

    it('should set createdAt and updatedAt', () => {
      const machine = Machine.create(createMachineProps);

      expect(machine.createdAt).toBeDefined();
      expect(machine.updatedAt).toBeDefined();
    });
  });

  describe('Machine.updateHourMeter', () => {
    it('should update hour meter to a higher value', () => {
      const machine = Machine.create(createMachineProps);
      machine.updateHourMeter(2000);

      expect(machine.hourMeter).toBe(2000);
    });

    it('should throw error when value is lower than current', () => {
      const machine = Machine.create(createMachineProps);

      expect(() => machine.updateHourMeter(1000)).toThrow(
        'Hour meter cannot be less than current value'
      );
    });
  });

  describe('Machine.assignToContract', () => {
    it('should change status to IN_CONTRACT', () => {
      const machine = Machine.create(createMachineProps);
      machine.assignToContract();

      expect(machine.status).toBe(MachineStatus.IN_CONTRACT);
    });

    it('should throw error when machine is in workshop', () => {
      const machine = Machine.create({
        ...createMachineProps,
        status: MachineStatus.IN_WORKSHOP,
      });

      expect(() => machine.assignToContract()).toThrow(
        'Cannot assign machine to contract while in workshop'
      );
    });
  });

  describe('Machine.sendToWorkshop', () => {
    it('should change status to IN_WORKSHOP', () => {
      const machine = Machine.create(createMachineProps);
      machine.sendToWorkshop();

      expect(machine.status).toBe(MachineStatus.IN_WORKSHOP);
    });

    it('should throw error when machine is in contract', () => {
      const machine = Machine.create({
        ...createMachineProps,
        status: MachineStatus.IN_CONTRACT,
      });

      expect(() => machine.sendToWorkshop()).toThrow(
        'Cannot send machine to workshop while in contract'
      );
    });
  });

  describe('Machine.markAvailable', () => {
    it('should change status to AVAILABLE', () => {
      const machine = Machine.create({
        ...createMachineProps,
        status: MachineStatus.IN_WORKSHOP,
      });
      machine.markAvailable();

      expect(machine.status).toBe(MachineStatus.AVAILABLE);
    });
  });

  describe('Machine.changeLocation', () => {
    it('should change location when machine is active', () => {
      const machine = Machine.create(createMachineProps);
      machine.changeLocation('Site B');

      expect(machine.currentLocation).toBe('Site B');
    });

    it('should throw error when machine is inactive', () => {
      const machine = Machine.create({
        ...createMachineProps,
        status: MachineStatus.INACTIVE,
      });

      expect(() => machine.changeLocation('Site B')).toThrow(
        'Cannot change location of inactive machine'
      );
    });
  });
});

describe('CreateMachine Use Case', () => {
  const mockRepository: IMachineRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a machine with AVAILABLE status', async () => {
    const createMachine = new CreateMachine(mockRepository);

    await createMachine.execute({
      code: 'MAQ001',
      type: 'Excavator',
      brand: 'Caterpillar',
      model: '320',
      year: 2022,
      serialNumber: 'CAT032022001',
      hourMeter: 1500,
      acquisitionDate: new Date('2022-01-15'),
      acquisitionValue: 150000,
      usefulLifeHours: 10000,
      currentLocation: 'Warehouse A',
    });

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedMachine = (mockRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedMachine.status).toBe(MachineStatus.AVAILABLE);
  });
});

describe('ChangeMachineStatus Use Case', () => {
  const mockRepository: IMachineRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when machine not found', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(null);
    const changeStatus = new ChangeMachineStatus(mockRepository);

    await expect(
      changeStatus.execute({
        machineId: 'non-existent-id',
        newStatus: MachineStatus.IN_CONTRACT,
      })
    ).rejects.toThrow('Machine not found');
  });

  it('should assign to contract', async () => {
    const machine = Machine.create({
      code: 'MAQ001',
      type: 'Excavator',
      brand: 'Caterpillar',
      model: '320',
      year: 2022,
      serialNumber: 'CAT032022001',
      hourMeter: 1500,
      acquisitionDate: new Date('2022-01-15'),
      acquisitionValue: 150000,
      usefulLifeHours: 10000,
      status: MachineStatus.AVAILABLE,
      currentLocation: 'Warehouse A',
    });
    (mockRepository.findById as jest.Mock).mockResolvedValue(machine);

    const changeStatus = new ChangeMachineStatus(mockRepository);
    await changeStatus.execute({
      machineId: machine.id!,
      newStatus: MachineStatus.IN_CONTRACT,
    });

    expect(machine.status).toBe(MachineStatus.IN_CONTRACT);
    expect(mockRepository.save).toHaveBeenCalledWith(machine);
  });
});

describe('GetMachineById Use Case', () => {
  const mockRepository: IMachineRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return machine when found', async () => {
    const machine = Machine.create({
      code: 'MAQ001',
      type: 'Excavator',
      brand: 'Caterpillar',
      model: '320',
      year: 2022,
      serialNumber: 'CAT032022001',
      hourMeter: 1500,
      acquisitionDate: new Date('2022-01-15'),
      acquisitionValue: 150000,
      usefulLifeHours: 10000,
      status: MachineStatus.AVAILABLE,
      currentLocation: 'Warehouse A',
    });
    (mockRepository.findById as jest.Mock).mockResolvedValue(machine);

    const getMachine = new GetMachineById(mockRepository);
    const result = await getMachine.execute(machine.id!);

    expect(result).toBe(machine);
  });

  it('should throw error when machine not found', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(null);

    const getMachine = new GetMachineById(mockRepository);

    await expect(getMachine.execute('non-existent-id')).rejects.toThrow(
      'Machine not found'
    );
  });
});

describe('ListMachines Use Case', () => {
  const mockRepository: IMachineRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all machines', async () => {
    const machines = [
      Machine.create({
        code: 'MAQ001',
        type: 'Excavator',
        brand: 'Caterpillar',
        model: '320',
        year: 2022,
        serialNumber: 'CAT032022001',
        hourMeter: 1500,
        acquisitionDate: new Date('2022-01-15'),
        acquisitionValue: 150000,
        usefulLifeHours: 10000,
        status: MachineStatus.AVAILABLE,
        currentLocation: 'Warehouse A',
      }),
      Machine.create({
        code: 'MAQ002',
        type: 'Loader',
        brand: 'John Deere',
        model: '644K',
        year: 2021,
        serialNumber: 'JD6442021001',
        hourMeter: 2000,
        acquisitionDate: new Date('2021-06-10'),
        acquisitionValue: 120000,
        usefulLifeHours: 8000,
        status: MachineStatus.IN_CONTRACT,
        currentLocation: 'Site B',
      }),
    ];
    (mockRepository.findAll as jest.Mock).mockResolvedValue(machines);

    const listMachines = new ListMachines(mockRepository);
    const result = await listMachines.execute();

    expect(result).toHaveLength(2);
    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
